const express = require('express')
const shortId = require('shortid')
const createHttpError = require('http-errors')
const mongoose = require('mongoose')
const {MongoClient} = require('mongodb')
const path = require('path')
const ShortUrl = require('./models/url.model')

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

require("dotenv").config();

// MongoClient
//   .connect(process.env.URI, {
  

//     useNewUrlParser: true, 
    
//     useUnifiedTopology: true 
    
//     })
//   .then(() => console.log('mongoose connected 💾'))
//   .catch((error) => console.log('Error connecting..',error))

  mongoose.connect(
    process.env.URI,{
      useNewUrlParser: true, 
    
      useUnifiedTopology: true 
    }
  )
  .then(()=>console.log('connected'))
  .catch(e=>console.log(e));


  app.set('view engine', 'ejs')

  app.get('/', async (req, res, next) => {
    res.render('index')
  })
  
  app.post('/', async (req, res, next) => {
    try {
      const { url } = req.body
      if (!url) {
        throw createHttpError.BadRequest('Provide a valid url')
      }
      const urlExists = await ShortUrl.findOne({ url })
      if (urlExists) {
        res.render('index', {
          // short_url: `${req.hostname}/${urlExists.shortId}`,
          short_url: `${req.headers.host}/${urlExists.shortId}`,
        })
        return
      }
      const shortUrl = new ShortUrl({ url: url, shortId: shortId.generate(),time:new Date() })
      const result = await shortUrl.save()
      res.render('index', {
        // short_url: `${req.hostname}/${urlExists.shortId}`,
        short_url: `${req.headers.host}/${result.shortId}`,
      })
    } catch (error) {
      next(error)
    }
  })
  
  app.get('/:shortId', async (req, res, next) => {
    try {
      const { shortId } = req.params
      const todaysDate = new Date();
      const result = await ShortUrl.findOne({ shortId })
      var difference = todaysDate.getTime() - result.time.getTime(); // This will give difference in milliseconds
      var resultInMinutes = Math.round(difference / 60000);
      
      if (!result) {
        throw createHttpError.NotFound('Short url does not exist')
      }
      if(resultInMinutes >5){
        throw createHttpError.NotFound('Short url Expired')
      }
      else{
        res.redirect(result.url)
      }
     
    } catch (error) {
      next(error)
    }
  })
  
  app.use((req, res, next) => {
    next(createHttpError.NotFound())
  })
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('index', { error: err.message })
  })
  
  app.listen(3000, () => console.log('🌏 on port 3000...'))