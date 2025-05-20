from collections import Counter
from pyscripts.steam_data_downloader import download_all_apps
from pyscripts.steam_data_retriever import SteamDataRetriever
from pyscripts.steam_trending_data_downloader import download_trend
from flask import Flask, render_template, jsonify, request
from pathlib import Path
import threading
app = Flask(__name__)
@app.route('/')
def index():
    search_base = Path('checkpoints') / 'searchresults'

    if search_base.exists():
        search_dirs = sorted(search_base.glob('search_results_*'))
    else:
        search_dirs = []

    if search_dirs:
        latest_folder = str(search_dirs[-1])
        retriever = SteamDataRetriever(
            checkpoint_folder='checkpoints',
            search_data_folder=latest_folder
        )
        raw_categories = retriever.load_all_search_results()
    else:
        raw_categories = {}

    seen_ids = set()
    categories = {}

    q = request.args.get('q')
    search_type = request.args.get('type', 'app-id')

    retriever = SteamDataRetriever()

    if q:
        if search_type == 'app-id' and q.isdigit():
            result = retriever.get_app_details(int(q))
            if result:
                categories['search'] = [result]
        elif search_type == 'name':
            categories['search'] = retriever.search_apps_by_name(q)
        elif search_type == 'developer':
            categories['search'] = retriever.get_apps_by_developer(q)
        elif search_type == 'genre':
            categories['search'] = retriever.get_apps_with_genre(q)
        elif search_type == 'tag':
            categories['search'] = retriever.get_apps_with_tag(q)
        else:
            categories['search'] = []

        category_titles = {
            'search': f'Search Results ({search_type})'
        }
    else:
        for category, games in raw_categories.items():

            unique_games = []
            for game in games:

                if len(unique_games) > 6:
                    break

                app_id = game.get('appid')
                appdetails = retriever.get_app_details(app_id)

                if appdetails == None:
                    continue

                if app_id and app_id not in seen_ids :
                    seen_ids.add(app_id)
                    unique_games.append(appdetails)

            categories[category] = unique_games

        category_titles = {
            'globaltopsellers': 'Global Top Sellers',
            'specials': 'Special Offers',
            'popularcommingsoon': 'Popular: Coming Soon',
            'topsellers': 'Top Sellers',
            'popularnew': 'Popular: New'
        }

    has_trending = bool(raw_categories) and not request.args.get('q')

    return render_template(
        'index.html',
        categories=categories,
        category_titles=category_titles,
        has_trending=has_trending
    )

@app.route('/search')
def search():
    search_type = request.args.get('type', 'default')
    return render_template('search.html', search_type=search_type)

@app.route('/api/search_app', methods=['GET'])
def search_app():
    q = request.args.get('q')
    search_type = request.args.get('type', 'name')

    retriever = SteamDataRetriever()

    if not q:
        return jsonify({'error': 'No query provided'}), 400

    if search_type == 'name':
        return jsonify(retriever.get_apps_by_name(q))

    elif search_type == 'app-id':
        if not q.isdigit():
            return jsonify({'error': 'App ID must be numeric'}), 400
        app_details = retriever.get_app_details(int(q))
        if app_details:
            return jsonify(app_details)
        else:
            return jsonify({'error': f'App with ID {q} not found'}), 404

    elif search_type == 'developer':
        return jsonify(retriever.get_apps_by_developer(q))

    elif search_type == 'genre':
        return jsonify(retriever.get_apps_with_genre(q))

    elif search_type == 'tag':
        return jsonify(retriever.get_apps_with_tag(q))

    return jsonify({'error': f'Unknown search type: {search_type}'}), 400


@app.route('/analytics/genre-breakdown')
def genre_breakdown():
    retriever = SteamDataRetriever(checkpoint_folder='checkpoints')
    genres_counter = Counter()

    for app in retriever.apps_dict.values():
        genres = app.get('genres', [])
        for genre in genres:
            genre_name = genre.get('description', 'Unknown')
            genres_counter[genre_name] += 1

    genres_sorted = genres_counter.most_common(30)

    top_10 = genres_sorted[:10]
    next_20 = genres_sorted[10:30]

    return render_template(
        'genre_breakdown.html',
        top_genres=top_10,
        other_genres=next_20
    )

@app.route('/analytics/tag-analysis')
def tag_analysis():
    retriever = SteamDataRetriever(checkpoint_folder='checkpoints')
    tags_counter = Counter()

    for app in retriever.apps_dict.values():
        tags = app.get('categories', [])
        for tag in tags:
            tag_name = tag.get('description', 'Unknown')
            tags_counter[tag_name] += 1

    tags_sorted = tags_counter.most_common(30)

    top_10 = tags_sorted[:10]
    next_20 = tags_sorted[10:30]

    return render_template(
        'tag_analysis.html',
        top_tags=top_10,
        other_tags=next_20
    )

@app.route('/analytics/price-analysis')
def price_analysis():
    retriever = SteamDataRetriever()
    apps = retriever.apps_dict.values()

    # Define price bins
    bins = {
        "Free": 0,
        "$0–5": 0,
        "$5–10": 0,
        "$10–20": 0,
        "$20–30": 0,
        "$30–50": 0,
        "$50–70": 0,
        "$70+": 0
    }

    for app in apps:
        if app.get("is_free"):
            bins["Free"] += 1
        elif "price_overview" in app:
            price = app["price_overview"].get("initial", 0) / 100  # convert from cents
            if price <= 5:
                bins["$0–5"] += 1
            elif price <= 10:
                bins["$5–10"] += 1
            elif price <= 20:
                bins["$10–20"] += 1
            elif price <= 30:
                bins["$20–30"] += 1
            elif price <= 50:
                bins["$30–50"] += 1
            elif price <= 70:
                bins["$50–70"] += 1
            else:
                bins["$70+"] += 1

    return render_template('price.html', price_buckets=bins)

APP_EVENT = threading.Event()
TREND_EVENT = threading.Event()

APP_PROGRESS = {
    "total":   0,
    "done":    0,
    "status":  "idle"
}

TREND_PROGRESS = {
    "total":   0,
    "done":    0,
    "status":  "idle"
}

@app.route('/api/download_app_data', methods=['POST'])
def trigger_app_download():
    # only start if not already running
    if APP_PROGRESS["status"] == "running" or (TREND_PROGRESS["status"] == "running"):
        return jsonify({"message": "Already running"}), 409

    def _background():
        def progress_cb(total, done, status):
            APP_PROGRESS["total"]  = total
            APP_PROGRESS["done"]   = done
            APP_PROGRESS["status"] = status

        download_all_apps(progress_callback=progress_cb, stop_event=APP_EVENT)
        APP_PROGRESS["status"] = "completed"

    # reset & start thread
    is_resume = (APP_PROGRESS["status"] == "paused")
    if not is_resume:
        APP_PROGRESS["total"] = 0
        APP_PROGRESS["done"] = 0
    APP_PROGRESS["status"] = "starting"
    APP_EVENT.clear()

    thread = threading.Thread(target=_background, daemon=True)
    thread.start()

    return jsonify({"message": "Download started"}), 202

@app.route('/api/stop_app_download', methods=['POST'])
def stop_app_download():
    APP_EVENT.set()
    APP_PROGRESS['status'] = 'paused'
    return jsonify({'message': 'Download paused'}), 200


@app.route('/api/download_app_progress')
def download_app_progress():
    return jsonify(APP_PROGRESS)

@app.route('/download_app')
def download_app_page():
    return render_template('download_app.html')

@app.route('/api/download_trend_data', methods=['POST'])
def trigger_trend_download():
    # only start if not already running
    if APP_PROGRESS["status"] == "running" or (TREND_PROGRESS["status"] == "running"):
        return jsonify({"message": "Already running"}), 409

    def _background():
        def progress_cb(total, done, status):
            TREND_PROGRESS["total"]  = total
            TREND_PROGRESS["done"]   = done
            TREND_PROGRESS["status"] = status

        download_trend(progress_callback=progress_cb, stop_event=TREND_EVENT)
        TREND_PROGRESS["status"] = "completed"

    # reset & start thread
    is_resume = (TREND_PROGRESS["status"] == "paused")
    if not is_resume:
        TREND_PROGRESS["total"] = 0
        TREND_PROGRESS["done"] = 0
    TREND_PROGRESS["status"] = "starting"
    TREND_EVENT.clear()

    thread = threading.Thread(target=_background, daemon=True)
    thread.start()

    return jsonify({"message": "Download started"}), 202

@app.route('/api/stop_trend_download', methods=['POST'])
def stop_trend_download():
    TREND_EVENT .set()
    TREND_PROGRESS['status'] = 'paused'
    return jsonify({'message': 'Download paused'}), 200


@app.route('/api/download_trend_progress')
def download_trend_progress():
    return jsonify(TREND_PROGRESS)

@app.route('/download_trend')
def download_trend_page():
    return render_template('download_trend.html')

if __name__ == '__main__':
    app.run(debug=True)