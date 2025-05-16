# Steam-Data-Explorer
A Python program that scrapes all listed games on the Steam Store Page and stores them for numerical or qualitative analysis. Users will be able to search for specific games by browsing, using a search bar or the exact app ID of the game. Users can access pre-configured statistics like pricing, genre, and tags. Visualizations of preconfigured data like popular genres on Steam can also be generated on request.

# Program Interface
The interface will be built by using Flask and mimics Steam's actual user interface. The user is able to navigate through the program with labeled buttons and drop-down menus to access data and statistics. The user will begin on the home page which provides several buttons to serve as a quick start option. For example, there could be buttons present to search for a game, pull up the top 50 most popular games, etc. 

# Data Collection and Storage
Data will be provided by running the two notebooks present in the notebooks directory. The Steam API returns JSON files which can be tied to their App ID in a dictionary, which can be converted into a pickle object for easy storage. With the slow rate of successful API calls to Steam allowed (200 successful calls per 5 minutes) in contrast to the vast library available on Steam, it is not recommended to update the list of apps since it would take around 3-4 days of continuous computing to gather every game again. Additionally, when updating game information, after 500 calls, the program will automatically save a copy to prevent losses due to early termination of the program.

# Data Analysis and Visualization
FOr data analysis and visualization, the program will come with frequency analysis of pricing, genres, and tags. Graphs and tables that effectively utilize these returned metrics will be provided alongside the source of the data.  Each statistic will have a complementary graphical representation.
