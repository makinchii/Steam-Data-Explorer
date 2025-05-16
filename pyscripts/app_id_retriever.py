import traceback
import requests
from pyscripts import steam_data_retriever
from pyscripts.steam_data_retriever import print_log


def get_app_ids():
    req = requests.get("https://api.steampowered.com/ISteamApps/GetAppList/v2/")

    if (req.status_code != 200):
        print_log("Failed to get all games on steam.")
        return

    try:
        data = req.json()
    except Exception as e:
        traceback.print_exc(limit=5)
        return {}

    apps_data = data['applist']['apps']

    apps_ids = []

    for app in apps_data:
        appid = app['appid']
        name = app['name']

        # skip apps that have empty name
        if not name:
            continue

        apps_ids.append(appid)

    return apps_ids

if __name__ == "__main__":

    id = 413150
    print_log(id in get_app_ids())

    retriever = steam_data_retriever.SteamDataRetriever()
    print_log(id in retriever.get_all_app_ids())