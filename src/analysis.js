/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */
const fs = require('fs');
const Papa = require('papaparse');

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const fileContent = fs.readFileSync(filename, 'utf8');
    return Papa.parse(fileContent, { header: true });
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    return csv.data
        .filter((row) => {
            // Filter out records with null values, except user_gender
            for (const key in row) {
                if (key === 'user_gender') continue;
                if (row[key] === null || row[key] === '') return false;
            }
            return true;
        })
        .map((row) => {
            const { user_id, user_age, user_country, user_gender, ...rest } =
                row;
            return {
                ...rest,
                review_id: parseInt(rest.review_id, 10),
                rating: parseFloat(rest.rating),
                review_date: new Date(rest.review_date),
                verified_purchase: rest.verified_purchase === 'True',
                num_helpful_votes: parseInt(rest.num_helpful_votes, 10),
                user: {
                    user_id: parseInt(user_id, 10),
                    user_age: parseInt(user_age, 10),
                    user_country,
                    user_gender,
                },
            };
        });
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4) return 'positive';
    if (rating < 2) return 'negative';
    return 'neutral';
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const appSentiments = {};
    for (const review of cleaned) {
        const sentiment = labelSentiment(review);
        if (!appSentiments[review.app_name]) {
            appSentiments[review.app_name] = {
                app_name: review.app_name,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }
        appSentiments[review.app_name][sentiment]++;
    }
    return Object.values(appSentiments);
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{review_language: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const langSentiments = {};
    for (const review of cleaned) {
        const sentiment = labelSentiment(review);
        const lang = review.review_language;
        if (!langSentiments[lang]) {
            langSentiments[lang] = {
                lang_name: lang,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }
        langSentiments[lang][sentiment]++;
    }
    return Object.values(langSentiments);
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    // Count reviews per app
    const appCounts = {};
    for (const review of cleaned) {
        appCounts[review.app_name] = (appCounts[review.app_name] || 0) + 1;
    }

    // Find most reviewed app
    let mostReviewedApp = '';
    let mostReviews = 0;
    for (const app in appCounts) {
        if (appCounts[app] > mostReviews) {
            mostReviews = appCounts[app];
            mostReviewedApp = app;
        }
    }

    // Filter reviews for the most reviewed app
    const appReviews = cleaned.filter((r) => r.app_name === mostReviewedApp);

    // Count devices for the most reviewed app
    const deviceCounts = {};
    for (const review of appReviews) {
        deviceCounts[review.device_type] =
            (deviceCounts[review.device_type] || 0) + 1;
    }

    // Find most used device
    let mostUsedDevice = '';
    let mostDevices = 0;
    for (const device in deviceCounts) {
        if (deviceCounts[device] > mostDevices) {
            mostDevices = deviceCounts[device];
            mostUsedDevice = device;
        }
    }

    // Calculate average rating
    const totalRating = appReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
        Math.round((totalRating / appReviews.length) * 1000) / 1000;

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
