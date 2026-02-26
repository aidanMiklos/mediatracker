import {MovieDb} from 'moviedb-promise';
import dotenv from 'dotenv';
import express from 'express';
import pug from 'pug';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';

const parser = new Parser();

const app = express();
const port = 3000;
import feeds from './rssfeeds.json' assert { type: 'json' };

dotenv.config()

// Serve static files from the 'public' directory
app.use(express.static(
	join(dirname(fileURLToPath(import.meta.url)), 'public')
));

app.set('view engine', 'pug')
app.use(express.json())

const moviedb = new MovieDb(process.env.KEY)

const findMovie = async (title) => {
	const res = await moviedb.searchMovie(title)

	return res
}

async function createFeed(shorts){
	const feedUrls = feeds.feeds;
	const feedPromises = feedUrls.map(url => parser.parseURL(url));
	const allFeeds = await Promise.all(feedPromises);

	// Flatten all items into a single array
	let combinedItems = allFeeds.flatMap(feed => 
		feed.items.map(item => ({
			...item,
			feedTitle: feed.title // Track which site each item came from
		}))
	);

	if(!shorts){
		combinedItems = combinedItems.filter(item => !item.link.includes("youtube.com/shorts"));
	}	

	// Optional: Sort by date (newest first)
	combinedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
	
	return combinedItems;
}

app.get('/', (req, res) => {
	res.render("index");
});

app.get('/feed', async (req, res) => {
	const feed = await createFeed(false);	
	res.render("feed", {items: feed});
});

app.get('/:page', (req, res) => {
  const page = req.params.page; // Gets 'page' from the URL
  res.render(page, (err, html) => {
    if (err) {
      // If page.pug doesn't exist, send a 404
      return res.status(404).send('Page Not Found');
    }
    res.send(html);
  });
});

app.post('/search', async (req, res, next) => {

	try {
		const params = {
			query: req.body.data,
			page: 1
		};

		const movie = await findMovie(params);
		
		const movies = movie.results;
		
		const userData = [];

		for(var i = 0; i < 5; i++){
			var user = {};
			console.log(movies[i]);
			try{ 
				user.title = movies[i].title;
				user.poster = "https://image.tmdb.org/t/p/w92/"+movies[i].poster_path;	
				if(movies[i].poster_path == null){
					user.poster = "https://c.tenor.com/8EK6VM5nbYgAAAAd/tenor.gif";
				}
			}
			catch(err){
				user.title = "None ;(";
				user.poster = "https://c.tenor.com/8EK6VM5nbYgAAAAd/tenor.gif";
			}

			userData.push(user);
		}

		res.render('media-cards', {userData: userData}, (err, html) => {
			if (err) console.log(err);
			res.send(html); // Sends back the raw HTML string
		});

	} catch (err) {
		console.log(err)
	}
})


app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
