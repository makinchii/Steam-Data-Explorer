import os
import pickle
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


def print_log(*args):
    """Print log with timestamp."""
    print(f"[{str(datetime.now())[:-3]}] ", end="")
    print(*args)


class SteamDataRetriever:
    def __init__(self, checkpoint_folder: str = 'checkpoints', search_data_folder: Optional[str] = None):
        """
        Initialize the SteamDataRetriever with:
          - checkpoint_folder: where your app-details checkpoints live
          - search_data_folder: where your category pickles live (optional)
        """
        self.checkpoint_folder  = Path(checkpoint_folder).resolve()
        self.search_data_folder = Path(search_data_folder).resolve() if search_data_folder else None

        self.apps_dict            = {}
        self.excluded_apps_list   = []

        self.search_categories = [
            'topsellers',
            'globaltopsellers',
            'popularnew',
            'popularcomingsoon',
            'specials'
        ]

        # Load the latest checkpoints
        self._load_latest_checkpoints()

    def _load_pickle(self, path_to_load: Path) -> Any:
        with open(path_to_load, "rb") as handle:
            return pickle.load(handle)

    def _load_latest_checkpoints(self) -> None:
        """Load the latest checkpoint files."""

        # Prefixes for the checkpoint files
        apps_dict_filename_prefix = 'apps_dict'
        exc_apps_filename_prefix = 'excluded_apps_list'
        error_apps_filename_prefix = 'error_apps_list'

        latest_apps_dict_ckpt_path, latest_exc_apps_list_ckpt_path, latest_error_apps_list_ckpt_path = self._check_latest_checkpoints(
            self.checkpoint_folder,
            apps_dict_filename_prefix,
            exc_apps_filename_prefix,
            error_apps_filename_prefix
        )

        if latest_apps_dict_ckpt_path and latest_apps_dict_ckpt_path.exists():
            self.apps_dict = self._load_pickle(latest_apps_dict_ckpt_path)
        else:
            print_log('No valid apps_dict checkpoint found.')

        if latest_exc_apps_list_ckpt_path and latest_exc_apps_list_ckpt_path.exists():
            self.excluded_apps_list = self._load_pickle(latest_exc_apps_list_ckpt_path)
        else:
            print_log('No valid excluded_apps_list checkpoint found.')

        if latest_error_apps_list_ckpt_path and latest_error_apps_list_ckpt_path.exists():
            self.error_apps_list = self._load_pickle(latest_error_apps_list_ckpt_path)
        else:
            print_log('No valid error_apps_list checkpoint found.')

    def _check_latest_checkpoints(self, checkpoint_folder, apps_dict_filename_prefix,
                                  exc_apps_filename_prefix, error_apps_filename_prefix):
        """
        Find the latest checkpoint files for each type.

        Args:
            checkpoint_folder: Path to the folder containing checkpoint files
            apps_dict_filename_prefix: Prefix for apps dict files
            exc_apps_filename_prefix: Prefix for excluded apps files
            error_apps_filename_prefix: Prefix for error apps files

        Returns:
            Tuple of paths to the latest checkpoint files (apps_dict, excluded_apps, error_apps)
        """
        latest_apps_dict_ckpt_path = None
        latest_exc_apps_list_ckpt_path = None
        latest_error_apps_list_ckpt_path = None

        if checkpoint_folder.exists():
            all_pkl = [
                Path(root, f)
                for root, dirs, files in os.walk(checkpoint_folder)
                for f in files
                if f.endswith('.p')
            ]

            # Filter and sort apps_dict files
            apps_dict_ckpt_files = sorted(
                [f for f in all_pkl if apps_dict_filename_prefix in f.name and "ckpt" in f.name]
            )
            if apps_dict_ckpt_files:
                latest_apps_dict_ckpt_path = apps_dict_ckpt_files[-1]

            # Filter and sort excluded_apps_list files
            exc_apps_list_ckpt_files = sorted(
                [f for f in all_pkl if exc_apps_filename_prefix in f.name and "ckpt" in f.name]
            )
            if exc_apps_list_ckpt_files:
                latest_exc_apps_list_ckpt_path = exc_apps_list_ckpt_files[-1]

            # Filter and sort error_apps files
            error_apps_ckpt_files = sorted(
                [f for f in all_pkl if error_apps_filename_prefix in f.name and 'ckpt' in f.name]
            )
            if error_apps_ckpt_files:
                latest_error_apps_list_ckpt_path = error_apps_ckpt_files[-1]

        return latest_apps_dict_ckpt_path, latest_exc_apps_list_ckpt_path, latest_error_apps_list_ckpt_path

    def load_search_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Load one category of search results, e.g. 'topsellers', from its .pkl.
        """
        if not self.search_data_folder:
            raise ValueError("No search_data_folder specified")

        if category not in self.search_categories:
            raise ValueError(f"Unknown category: {category}")

        # filename: e.g. "topsellers_20250506.pkl"
        suffix = self.search_data_folder.name[-8:]
        fname = f"{category}_{suffix}.pkl"
        path = self.search_data_folder / fname

        if not path.exists():
            print_log(f"No search results pickle for '{category}': {path}")
            return []

        return self._load_pickle(path)

    def load_all_search_results(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Return a dict mapping each category name to its list of games.
        """
        return {
            cat: self.load_search_category(cat)
            for cat in self.search_categories
        }

    def get_all_app_ids(self) -> List[int]:
        """
        Get a list of all valid app IDs.

        Returns:
            List of app IDs as integers
        """
        return list(map(int, self.apps_dict.keys()))

    def get_app_details(self, app_id: int) -> Optional[Dict]:
        """
        Get details for a specific app.

        Args:
            app_id: The app ID to retrieve

        Returns:
            Dictionary of app details or None if not found
        """

        if app_id in self.apps_dict.keys():
            return self.apps_dict[app_id]
        return None

    def search_apps_by_name(self, search_term: str) -> List[Dict]:
        """
        Search for apps by name.

        Args:
            search_term: The search term to look for in app names

        Returns:
            List of app details dictionaries that match the search
        """
        search_term = search_term.lower()
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'name' in app_data and search_term in app_data['name'].lower():
                results.append(app_data)

        return results

    def filter_apps_by_type(self, app_type: str) -> List[Dict]:
        """
        Filter apps by type (game, dlc, software, etc.).

        Args:
            app_type: The type of app to filter for

        Returns:
            List of app details dictionaries of the specified type
        """
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'type' in app_data and app_data['type'].lower() == app_type.lower():
                results.append(app_data)

        return results

    def filter_apps_by_price_range(self, min_price: float = 0.0, max_price: float = float('inf')) -> List[Dict]:
        """
        Filter apps by price range.

        Args:
            min_price: Minimum price (inclusive)
            max_price: Maximum price (inclusive)

        Returns:
            List of app details dictionaries within the price range
        """
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'price_overview' in app_data:
                # Price is often stored in cents, convert to dollars
                price = app_data['price_overview'].get('initial', 0) / 100
                if min_price <= price <= max_price:
                    results.append(app_data)

        return results

    def get_apps_with_genre(self, genre: str) -> List[Dict]:
        """
        Get apps have a specific genre.

        Args:
            genre: The genre to search for

        Returns:
            List of app details dictionaries within the specified genre
        """
        genre = genre.lower()
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'genres' in app_data:
                genres = app_data['genres']
                for gen in genres:
                    if 'description' in gen and genre in gen['description'].lower():
                        results.append(app_data)
                        break
        return results

    def get_apps_with_tag(self, tag: str) -> List[Dict]:
        """
        Get apps that have a specific tag.

        Args:
            tag: The tag to search for

        Returns:
            List of app details dictionaries that have the tag
        """
        tag = tag.lower()
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'categories' in app_data:
                categories = app_data['categories']
                for category in categories:
                    if 'description' in category and tag in category['description'].lower():
                        results.append(app_data)
                        break

        return results

    def get_apps_by_developer(self, developer: str) -> List[Dict]:
        """
        Get apps by a specific developer.

        Args:
            developer: The developer name to search for

        Returns:
            List of app details dictionaries by the developer
        """
        developer = developer.lower()
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'developers' in app_data:
                developers = app_data['developers']
                for dev in developers:
                    if developer in dev.lower():
                        results.append(app_data)
                        break

        return results

    def get_apps_by_publisher(self, publisher: str) -> List[Dict]:
        """
        Get apps by a specific publisher.

        Args:
            publisher: The publisher name to search for

        Returns:
            List of app details dictionaries by the publisher
        """
        publisher = publisher.lower()
        results = []

        for app_id, app_data in self.apps_dict.items():
            if 'publishers' in app_data:
                publishers = app_data['publishers']
                for pub in publishers:
                    if publisher in pub.lower():
                        results.append(app_data)
                        break

        return results

    def get_data_stats(self) -> Dict:
        """
        Get statistics about the loaded data.

        Returns:
            Dictionary with statistics about the data
        """
        return {
            'total_apps': len(self.apps_dict),
            'excluded_apps': len(self.excluded_apps_list),
            'error_apps': len(self.error_apps_list)
        }

def test_search():

    retriever = SteamDataRetriever("../checkpoints")
    id = 440
    app_details = retriever.get_app_details(id)
    print(app_details)

    if app_details:
        print_log(retriever.search_apps_by_name(app_details.get('name')))
        for developer in app_details.get('developers'):
            print_log(retriever.get_apps_by_developer(developer))
    else:
        print_log(f"Could not retrieve details for app {id}.")

if __name__ == "__main__":
    test_search()