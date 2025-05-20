import os
import re
import time
import pickle
import requests
from pathlib import Path
from datetime import datetime

def print_log(*args):
    print(f"[{str(datetime.now())[:-3]}]", *args)

def get_search_results(params):
    url = "https://store.steampowered.com/search/results/"
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        print_log(f"Failed to get search results: {resp.status_code}")
        return {"items": []}
    try:
        return resp.json()
    except Exception as e:
        print_log(f"Failed to parse search results: {e}")
        return {"items": []}

def save_pickle(path: Path, obj):
    with open(path, 'wb') as f:
        pickle.dump(obj, f, protocol=pickle.HIGHEST_PROTOCOL)

def load_pickle(path: Path):
    return pickle.load(open(path, 'rb'))

def save_checkpoints(folder: Path,
                     apps_prefix: str,
                     exc_prefix: str,
                     err_prefix: str,
                     apps_dict: dict,
                     excluded_list: list,
                     error_list: list):
    folder.mkdir(parents=True, exist_ok=True)
    save_pickle(folder / f"{apps_prefix}-ckpt-fin.p", apps_dict)
    print_log(f"Checkpoint saved: {apps_prefix}")
    save_pickle(folder / f"{exc_prefix}-ckpt-fin.p", excluded_list)
    print_log(f"Checkpoint saved: {exc_prefix}")
    save_pickle(folder / f"{err_prefix}-ckpt-fin.p", error_list)
    print_log(f"Checkpoint saved: {err_prefix}")

def check_latest_checkpoints(folder: Path,
                             apps_prefix: str,
                             exc_prefix: str,
                             err_prefix: str):
    all_files = [p for p in folder.glob('*.p')]
    def latest(prefix):
        cands = [p for p in all_files if prefix in p.name and 'ckpt' in p.name]
        return sorted(cands)[-1] if cands else None
    return latest(apps_prefix), latest(exc_prefix), latest(err_prefix)

APPS_DICT_PREFIX      = 'apps_dict'
EXCLUDED_APPS_PREFIX  = 'excluded_apps_list'
ERROR_APPS_PREFIX     = 'error_apps_list'
CHECKPOINT_FOLDER     = Path(__file__).resolve().parents[1] / 'checkpoints'

def download_trend(progress_callback=None, stop_event=None, app_details=None, appid=None):

    def get_app_details(appid):
        while (True):
            endpoint = "https://store.steampowered.com/api/appdetails/"
            params = {"appids": appid, "cc": "US", "l": "english"}

            appdetails_req = requests.get(endpoint, params=params)

            if appdetails_req.status_code == 200:
                appdetails = appdetails_req.json()
                appdetails = appdetails[str(appid)]
                print_log(f"App Id: {appid} - {appdetails['success']}")
                if progress_callback:
                    progress_callback(total, done, f"fetched {appid}")
                break

            elif appdetails_req.status_code == 429:
                print_log(f'Too many requests. Sleep for 10 sec')
                if progress_callback:
                    progress_callback(total, done, f"Too many requests. Put App ID {appid} back in queue. Sleep for 10 sec")
                time.sleep(10)
                continue

            elif appdetails_req.status_code == 403:
                print_log(f'Forbidden to access. Sleep for 5 min.')
                if progress_callback:
                    progress_callback(total, done, f'Forbidden to access. Put App ID {appid} back to deque. Sleep for 5 min.')
                time.sleep(5 * 60)
                continue

            else:
                print_log("ERROR: status code:", appdetails_req.status_code)
                print_log(f"Error in App Id: {appid}.")
                if progress_callback:
                    progress_callback(total, done, f"Error in App Id: {appid}. Put the app to error apps list.")
                appdetails = {}
                break

        return appdetails

    if app_details and appid:
        app_details = get_app_details(appid)
        return app_details

    print_log('Checkpoint folder:', CHECKPOINT_FOLDER)
    apps_dict     = {}
    excluded_apps = []
    error_apps    = []

    # load previous checkpoints
    ckpt_paths = check_latest_checkpoints(
        CHECKPOINT_FOLDER,
        APPS_DICT_PREFIX,
        EXCLUDED_APPS_PREFIX,
        ERROR_APPS_PREFIX
    )

    for aid, payload in list(apps_dict.items()):
        if isinstance(payload, dict) and "data" in payload:
            apps_dict[aid] = payload["data"]
            print_log(f"Migrated app {aid} to new format")

    for label, path in zip(['apps_dict','excluded','error'], ckpt_paths):
        if path:
            loaded = load_pickle(path)
            print_log(f"Loaded {label} ({len(loaded)} items): {path}")
            if label == 'apps_dict':   apps_dict     = loaded
            elif label == 'excluded':  excluded_apps = loaded
            else:                      error_apps    = loaded

    execute_time  = datetime.now().strftime('%Y%m%d')
    search_folder = CHECKPOINT_FOLDER / 'searchresults' / f'search_results_{execute_time}'
    search_folder.mkdir(parents=True, exist_ok=True)

    params_list = [
        {'filter':'topsellers'},
        {'filter':'globaltopsellers'},
        {'filter':'popularnew'},
        {'filter':'popularcommingsoon'},
        {'filter':'', 'specials':1}
    ]
    page_list      = list(range(1, 5))
    default_params = {'hidef2p':1, 'json':1, 'page':1, 'filter':'topsellers'}

    total = 500
    done = 0

    if progress_callback:
        progress_callback(total, done, "starting")

    for update in params_list:

        if stop_event and stop_event.is_set():
            return

        date_str = execute_time
        name     = update['filter'] or 'specials'
        filename = f"{name}_{date_str}.pkl"
        out_path = search_folder / filename
        if out_path.exists():
            if progress_callback:
                done += 100
                progress_callback(total, done, "")
            print_log(f"File exists, skipping: {filename}")
            continue

        items_all = []
        for page in page_list:

            if stop_event and stop_event.is_set():
                return

            params = default_params.copy()
            params.update(update)
            params['page'] = page

            sr = get_search_results(params)
            raw_items = sr.get('items', [])

            non_bundle_items = [
                item for item in raw_items
                if 'bundles' not in item.get('logo','')
            ]
            print_log(
                f"Page {page} ({update['filter']}): "
                f"{len(non_bundle_items)} non-bundle of {len(raw_items)} total"
            )

            # extract appid
            for item in non_bundle_items:
                m = re.search(r"steam/\w+/(\d+)", item.get('logo',''))
                item['appid'] = int(m.group(1)) if m else None

            # get details only for valid appids
            for item in non_bundle_items:

                if stop_event and stop_event.is_set():
                    return

                aid = item['appid']
                if not aid:
                    continue

                details = get_app_details(aid)

                if details and details['success'] == True:
                    apps_dict[aid] = details["data"]
                    print_log(f"{'Added' if aid not in apps_dict else 'Updated'} app {aid}")
                else:
                    if aid not in excluded_apps:
                        excluded_apps.append(aid)
                        print_log(f"Excluded app {aid}")

                if progress_callback:
                    done += 1
                    progress_callback(total, done, f"Added App ID: {aid}")

            items_all.extend(non_bundle_items)

        if progress_callback:
            progress_callback(total, done, "finalizing")

        print_log(f"[DEBUG] {name}: would write {len(items_all)} items to {out_path}")

        # save raw, filtered search results
        with open(out_path, 'wb') as f:
            pickle.dump(items_all, f)
        print_log(f"Saved search results: {filename}")

        # checkpoint
        save_checkpoints(
            CHECKPOINT_FOLDER,
            APPS_DICT_PREFIX,
            EXCLUDED_APPS_PREFIX,
            ERROR_APPS_PREFIX,
            apps_dict,
            excluded_apps,
            error_apps
        )

if __name__ == '__main__':
    print(os.path.exists('../checkpoints/searchresults/search_results_20250519'))
    print(load_pickle('../checkpoints/searchresults/search_results_20250519/popularcommingsoon_20250519.pkl'))

