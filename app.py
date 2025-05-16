from collections import Counter

from flask import Flask, render_template, jsonify, request
from pyscripts.steam_data_retriever import SteamDataRetriever
from pathlib import Path

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
                app_id = game.get('appid')
                if app_id and app_id not in seen_ids:
                    seen_ids.add(app_id)
                    unique_games.append(game)
            categories[category] = unique_games

        category_titles = {
            'globaltopsellers': 'Global Top Sellers',
            'specials': 'Special Offers',
            'popularcomingsoon': 'Popular: Coming Soon',
            'topsellers': 'Top Sellers',
            'popularnew': 'Popular: New'
        }

    return render_template(
        'index.html',
        categories=categories,
        category_titles=category_titles
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
        return jsonify(retriever.search_apps_by_name(q))

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

if __name__ == '__main__':
    app.run(debug=True)