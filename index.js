const express = require('express');
const app = express();
const pool = require('./config/db'); // Ensure the path to db.js is correct
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { log } = require('console');

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

app.use(express.json()); // For parsing JSON bodies

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure 'uploads/' directory exists
        const dir = './uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir); // Directory to save the images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid file name conflicts
    }
});

// Change here to accept multiple files
const upload = multer({ storage: storage }).array('images[]');

// Middleware to handle multer errors
const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return res.status(400).json({ error: err.message });
    } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(500).json({ error: 'An unknown error occurred' });
    }
    next();
};

app.post('/products', upload, multerErrorHandler, async (req, res) => {
    console.log(req.body); // Log form data
    console.log(req.files); // Log uploaded files
    const { name, price, description } = req.body;

    // Validate the request body
    if (!name || !price || !description) {
        return res.status(400).json({ error: 'Name, price, and description are required' });
    }

    try {
        // Insert the new product into the products table
        const newProduct = await pool.query(
            "INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *",
            [name, price, description]
        );
    
        console.log(newProduct.rows);
        const productId = newProduct.rows[0].id; // Get the ID of the newly created product
        let imageUrls = [];
    
        if (req.files) {
            // Map over the uploaded files to create URLs
            imageUrls = req.files.map(file => `/uploads/${file.filename}`);
            // Insert each image URL into the product_images table
            for (const imageUrl of imageUrls) {
                await pool.query(
                    "INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)",
                    [productId, imageUrl]
                );
            }
        }
    
        // Respond with the newly created product along with the image URLs
        res.json({
            product: newProduct.rows[0],
            images: imageUrls // Include the image URLs in the response
        });
    } catch (err) {
        console.error(err.message); // Log any errors
        res.status(500).send('Server Error'); // Send a server error response
    }
    
});


// Get all products with images
app.get('/products', async (req, res) => {
    try {
        // Query to retrieve all products with their associated images using FULL JOIN
        const result = await pool.query(`
            SELECT p.*, pi.image_url 
            FROM products p 
            FULL JOIN product_images pi ON p.id = pi.product_id
        `);

        console.log("result",result);
        

        // Initialize an empty array to hold products
        const products = [];

        // Loop through the result rows
        for (const row of result.rows) {
            const { id, name, price, description, image_url } = row;

            // Check if the product already exists in the products array
            let existingProduct = products.find(product => product.id === id);

            if (existingProduct) {
                // If the product exists, add the new image to its images array
                if (image_url) {
                    existingProduct.images.push(image_url);
                }
            } else {
                // If the product does not exist, create a new object for it
                products.push({
                    id,
                    name,
                    price,
                    description,
                    images: image_url ? [image_url] : [] // Initialize images array
                });
            }
        }

        // Respond with the organized products
        res.json(products);
    } catch (err) {
        console.error(err.message); // Log any errors
        res.status(500).send('Server Error'); // Send a server error response
    }
});




// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
