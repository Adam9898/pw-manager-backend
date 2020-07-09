import express from "express";

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});

router.get('/hey', (req, res, next) => {
    res.json({native: 1});
});

module.exports = router;
