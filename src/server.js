const express = require("express");
const pool = require("./config/db.js");
const port = "1337"
const cors = require('cors');
const app = express()
app.use(cors());
// dotenv.config();
app.use(express.json())


app.get('/getUser',async(req,res)=>{
  try{
     const data = await pool.query('SELECT * FROM users')
      res.status(200).send(data.rows)
  } catch (err){
      console.log(err)
      res.sendStatus(500)
  }
})


app.post('/insert', async (req, res) => {
  try {

    const {name, address} = req.body;

    if (!name){
      return res.status(400).send({
          success:false,
          message:"name is required"
      });
    }


    await pool.query(`INSERT INTO userss (name, address) VALUES ($1,$2)`,[name,address || null] );
    
    res.status(200).send({
      success: true,
      message: "user inserted successfully"
    });

  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).send({
      success: false,
      message: "Failed to saved data",
      error: err.message
    });
  }
});

// app.post('/products/:id', async (req,res)=>{
//   try{
//       await pool.query('CREATE TABLE products (id VARCHAR(255) PRIMARY KEY,name VARCHAR(255) NOT NULL,category VARCHAR(100) NOT NULL,price DECIMAL(10, 2) NOT NULL)')
//       res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
//   } catch (err){
//       console.log(err)
//       res.sendStatus(500)
//   }
// })


// app.post('/shoeTable', async (req,res)=>{
//   try{
//       await pool.query('CREATE TABLE products (id VARCHAR(255) PRIMARY KEY,name VARCHAR(255) NOT NULL,category VARCHAR(100) NOT NULL,price DECIMAL(10, 2) NOT NULL)')
//       res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
//   } catch (err){
//       console.log(err)
//       res.sendStatus(500)
//   }
// })

// app.post('/setup', async (req,res)=>{
//   try{
//       await pool.query('CREATE TABLE userss(id SERIAL PRIMARY KEY, name VARCHAR(100), address VARCHAR(100))')
//       res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
//   } catch (err){
//       console.log(err)
//       res.sendStatus(500)
//   }
// })

app.post('/')

app.post('/createShoeTable', async (req,res)=>{
  try{
      await pool.pool.query('CREATE TABLE IF NOT EXISTS sneakers (id SERIAL PRIMARY KEY,name VARCHAR(100),price NUMERIC(10),subtitle VARCHAR(255),mainImage TEXT,tagline VARCHAR(100),environmental_info TEXT,description TEXT,color_name VARCHAR(100),style_code VARCHAR(50),made_in VARCHAR(100),is_new BOOLEAN,thumbnails JSONB,sizes JSONB)')
      res.status(200).send({message:"SUCCESFULLY CREATE TABLE"})
  } catch (err){
      console.log(err)
      res.sendStatus(500)
  }
})

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ message: 'API is working' });
});


app.get('/health', async (req, res) => {
  try {
    const result = await pool.pool.query('SELECT NOW()');
    res.status(200).send({
      status: 'ok',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).send({ status: 'error', message: err.message });
  }
});

// app.post('/sneakers', async (req, res) => {
//   const {id, name, price, mainImage, subtitle } = req.body;
//   try {
//     const result = await pool.pool.query(
//       'INSERT INTO sneakers (id, name, price, mainImage, subtitle) VALUES ($1, $2, $3, $4, $5) RETURNING *',
//       [id, name, price, mainImage, subtitle]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


app.post('/createUsers', async (req, res) => {
  const {clerk_id, email, role} = req.body;
  try {

    const checkResut = await pool.pool.query('SELECT * from users where clerk_id = $1', [clerk_id]);

    if (checkResut.rows.length > 0 ){
      return res.send("user with this clerk ID already exist")
    }

    const result = await pool.pool.query(
      'INSERT INTO users (clerk_id, email, role) VALUES ($1, $2, $3) RETURNING *',
      [clerk_id, email, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/getUserRole', async (req, res) => {
  const { clerk_id } = req.query;
  try {
    const result = await pool.pool.query(
      'SELECT role FROM users WHERE clerk_id = $1',
      [clerk_id]
    );
    
    if (result.rows.length > 0) {
      res.json({ role: result.rows[0].role });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/createUserTable', async (req, res) => {
  try {
    await pool.pool.query(
      'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, clerk_id VARCHAR(255) UNIQUE, email VARCHAR(255) UNIQUE NOT NULL, role VARCHAR(50) DEFAULT \'user\')'
    );
    res.status(200).send({message: "SUCCESSFULLY CREATED USERS TABLE"});
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post('/createAddressTable', async (req, res) => {
  try {
    // Most basic version - should work with all PostgreSQL versions
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        userId VARCHAR(255),
        fullName VARCHAR(255),
        address VARCHAR(255),
        city VARCHAR(255),
        postalCode VARCHAR(50),
        country VARCHAR(100)
      )
    `;
    
    await pool.pool.query(createTableQuery);
    console.log("Table created successfully");
    
    res.status(200).send({message: "SUCCESSFULLY CREATED ADDRESSES TABLE"});
  } catch (err) {
    console.error("Error creating addresses table:", err);
    res.status(500).send({message: "Error creating addresses table", error: err.message});
  }
});

app.post('/insertAddress', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    const { userId, fullName, address, city, postalCode, country } = req.body;
    
    // Validate all required fields
    if (!userId || !fullName || !address || !city || !postalCode || !country) {
      return res.status(400).send({ message: "All fields are required, including userId" });
    }
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if this user already has an address
    const existingAddress = await client.query(
      'SELECT id FROM addresses WHERE userId = $1',
      [userId]
    );
    
    let result;
    
    if (existingAddress.rows.length > 0) {
      // Update existing address
      result = await client.query(
        `UPDATE addresses 
         SET fullName = $1, address = $2, city = $3, postalCode = $4, country = $5
         WHERE userId = $6
         RETURNING id`,
        [fullName, address, city, postalCode, country, userId]
      );
      
      await client.query('COMMIT');
      
      res.status(200).send({
        message: "Address updated successfully",
        id: result.rows[0].id
      });
    } else {
      // Insert new address
      result = await client.query(
        `INSERT INTO addresses (userId, fullName, address, city, postalCode, country)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, fullName, address, city, postalCode, country]
      );
      
      await client.query('COMMIT');
      
      res.status(201).send({
        message: "Address added successfully",
        id: result.rows[0].id
      });
    }
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error("Error in insertAddress:", err);
    res.status(500).send({ message: "Failed to insert address", error: err.message });
  } finally {
    client.release();
  }
});

app.post('/insertSneaker', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      name,
      subtitle,
      price,
      mainImage,
      tagline,
      environmentalInfo,
      description,
      colorName,
      styleCode,
      madeIn,
      isNew,
      isBestSeller,
      thumbnails,
      sizes,
      colors
    } = req.body;
    
    // Insert product
    const productResult = await client.query(`
      INSERT INTO products (
        name, subtitle, price, "mainImage", tagline,
        "environmentalInfo", description, "colorName",
        "styleCode", "madeIn", "isNew", "isBestSeller"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      name,
      subtitle,
      price,
      mainImage,
      tagline,
      environmentalInfo,
      description,
      colorName,
      styleCode,
      madeIn,
      isNew || false,
      isBestSeller || false
    ]);
    
    const productId = productResult.rows[0].id;
    
    // Insert thumbnails
    if (thumbnails && thumbnails.length > 0) {
      for (const thumb of thumbnails) {
        await client.query(
          'INSERT INTO thumbnails (id, product_id, img, alt) VALUES ($1, $2, $3, $4)',
          [thumb.id, productId, thumb.img, thumb.alt]
        );
      }
    }
    
    // Insert sizes
    if (sizes && sizes.length > 0) {
      for (const size of sizes) {
        await client.query(
          'INSERT INTO sizes (id, product_id, label) VALUES ($1, $2, $3)',
          [size.id, productId, size.label]
        );
      }
    }
    

    if (colors && typeof colors === 'number') {
      // Insert the single count value
      await client.query(
        'INSERT INTO product_colors (product_id, color) VALUES ($1, $2)',
        [productId, colors]
      );
    } 
    
    await client.query('COMMIT');
    res.status(201).send({
      message: "SUCCESSFULLY INSERTED SNEAKER",
      productId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).send({message: "Error inserting sneaker", error: err.message});
  } finally {
    client.release();
  }
});

app.post('/createSneakerTables', async (req, res) => {
  try {
    // Create products table
    await pool.pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        subtitle TEXT,
        price TEXT NOT NULL,
        "mainImage" TEXT NOT NULL,
        tagline TEXT,
        "environmentalInfo" TEXT,
        description TEXT,
        "colorName" TEXT,
        "styleCode" TEXT,
        "madeIn" TEXT,
        "isNew" BOOLEAN DEFAULT false,
        "isBestSeller" BOOLEAN DEFAULT false
      )
    `);
    
    // Create thumbnails table
    await pool.pool.query(`
      CREATE TABLE IF NOT EXISTS thumbnails (
        id TEXT PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        img TEXT,
        alt TEXT
      )
    `);
    
    // Create sizes table
    await pool.pool.query(`
      CREATE TABLE IF NOT EXISTS sizes (
        id TEXT PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        label TEXT
      )
    `);
    
    // Create colors table (array of strings in the product)
    await pool.pool.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        color TEXT,
        PRIMARY KEY (product_id, color)
      )
    `);
    
    res.status(200).send({message: "SUCCESSFULLY CREATED SNEAKER TABLES"});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: "Error creating tables", error: err.message});
  }
});

app.delete('/deleteProduct/:id', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
 
    await client.query('DELETE FROM thumbnails WHERE product_id = $1', [id]);
    await client.query('DELETE FROM sizes WHERE product_id = $1', [id]);
    await client.query('DELETE FROM product_colors WHERE product_id = $1', [id]);
    
    // Delete the product
    const result = await client.query('DELETE FROM products WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await client.query('COMMIT');
    console.log(`Successfully deleted product with ID: ${id}`);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/getUsers', async (req, res) => {
  try {
    console.log('Starting query to users table');
    const result = await pool.pool.query('SELECT * FROM users');
    console.log(`Query successful, found ${result.rows.length} rows`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/editProduct/:id', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    const { id } = req.params;
    const productData = req.body;
    
    await client.query('BEGIN');
    
    // Update product
    await client.query(`
      UPDATE products SET
        name = $1,
        subtitle = $2,
        price = $3,
        "mainImage" = $4,
        tagline = $5,
        "environmentalInfo" = $6,
        description = $7,
        "colorName" = $8,
        "styleCode" = $9,
        "madeIn" = $10,
        "isNew" = $11,
        "isBestSeller" = $12
      WHERE id = $13
    `, [
      productData.name,
      productData.subtitle || null,
      productData.price,
      productData.mainImage,
      productData.tagline || null,
      productData.environmentalInfo || null,
      productData.description || null,
      productData.colorName || null,
      productData.styleCode || null,
      productData.madeIn || null,
      productData.isNew || false,
      productData.isBestSeller || false,
      id
    ]);
    
    // Delete existing thumbnails
    await client.query('DELETE FROM thumbnails WHERE product_id = $1', [id]);
    
    // Insert new thumbnails
    if (productData.thumbnails && productData.thumbnails.length > 0) {
      for (const thumb of productData.thumbnails) {
        // Generate a random ID for each thumbnail
        const thumbId = `thumb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await client.query(
          'INSERT INTO thumbnails (id, product_id, img, alt) VALUES ($1, $2, $3, $4)',
          [thumbId, id, thumb.img, thumb.alt || '']
        );
      }
    }
    
    // Delete existing sizes
    await client.query('DELETE FROM sizes WHERE product_id = $1', [id]);
    
    // Insert new sizes
    if (productData.sizes && productData.sizes.length > 0) {
      for (const size of productData.sizes) {
        // Generate a random ID for each size
        const sizeId = `size_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await client.query(
          'INSERT INTO sizes (id, product_id, label) VALUES ($1, $2, $3)',
          [sizeId, id, size.label]
        );
      }
    }
    
    // Delete existing colors
    await client.query('DELETE FROM product_colors WHERE product_id = $1', [id]);
    
    // Insert colors (using default value of 1 if not specified)
    const colorValue = productData.colors || 1;
    await client.query(
      'INSERT INTO product_colors (product_id, color) VALUES ($1, $2)',
      [id, colorValue.toString()]
    );
    
    await client.query('COMMIT');
    
    console.log(`Successfully updated product with ID: ${id}`);
    return res.status(200).json({ 
      message: 'Product updated successfully',
      productId: id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating product:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});



// Update user role endpoint
app.put('/updateUserRole', async (req, res) => {
  const { clerk_id, role } = req.body;
  
  if (!clerk_id || !role) {
    return res.status(400).json({ error: "clerk_id and role are required" });
  }
  
  try {
    const result = await pool.pool.query(
      'UPDATE users SET role = $1 WHERE clerk_id = $2 RETURNING *',
      [role, clerk_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// for product admin  
app.get('/getSneakers', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    console.log('Starting query to get sneakers with related data');
    
    // Get all products
    const productsResult = await client.query('SELECT * FROM products');
    const products = productsResult.rows;
    
    // For each product, get related data
    const productsWithRelatedData = await Promise.all(products.map(async (product) => {
      // Get thumbnails
      const thumbnailsResult = await client.query(
        'SELECT * FROM thumbnails WHERE product_id = $1',
        [product.id]
      );
      
      // Get sizes
      const sizesResult = await client.query(
        'SELECT * FROM sizes WHERE product_id = $1',
        [product.id]
      );
      
      // Get colors
      const colorsResult = await client.query(
        'SELECT * FROM product_colors WHERE product_id = $1',
        [product.id]
      );
      
      // Combine all data
      return {
        ...product,
        thumbnails: thumbnailsResult.rows,
        sizes: sizesResult.rows,
        colors: colorsResult.rows
      };
    }));
    
    console.log(`Query successful, found ${productsWithRelatedData.length} products with related data`);
    return res.status(200).json(productsWithRelatedData);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/getSneakers', async (req, res) => {
  try {
    console.log('Starting query to sneakers table');
    const result = await pool.pool.query('SELECT * from products');
    console.log(`Query successful, found ${result.rows.length} rows`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: err.message });
  }
});


app.get('/getSneaker/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Validate the ID8
    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Convert string to integer explicitly
    const productIdInt = parseInt(productId, 10);
    
    // Complex query with left joins to get all related data at once
    const result = await pool.pool.query(`
      SELECT 
        p.*,
        t.id as thumb_id, t.img as thumb_img, t.alt as thumb_alt,
        s.id as size_id, s.label as size_label,
        pc.color
      FROM products p
      LEFT JOIN thumbnails t ON p.id = t.product_id
      LEFT JOIN sizes s ON p.id = s.product_id
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      WHERE p.id = $1
    `, [productIdInt]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Process the joined result to create a properly structured object
    const product = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      subtitle: result.rows[0].subtitle,
      price: result.rows[0].price,
      mainImage: result.rows[0].mainImage,
      tagline: result.rows[0].tagline,
      environmentalInfo: result.rows[0].environmentalInfo,
      description: result.rows[0].description,
      colorName: result.rows[0].colorName,
      styleCode: result.rows[0].styleCode,
      madeIn: result.rows[0].madeIn,
      isNew: result.rows[0].isNew,
      isBestSeller: result.rows[0].isBestSeller,
      thumbnails: [],
      sizes: [],
      colors: []
    };
    
    // Extract unique thumbnails, sizes, and colors
    const thumbnailsMap = new Map();
    const sizesMap = new Map();
    const colorsSet = new Set();
    
    result.rows.forEach(row => {
      // Add thumbnail if it exists and is not already added
      if (row.thumb_id && !thumbnailsMap.has(row.thumb_id)) {
        thumbnailsMap.set(row.thumb_id, {
          id: row.thumb_id,
          img: row.thumb_img,
          alt: row.thumb_alt
        });
      }
      
      // Add size if it exists and is not already added
      if (row.size_id && !sizesMap.has(row.size_id)) {
        sizesMap.set(row.size_id, {
          id: row.size_id,
          label: row.size_label
        });
      }
      
      // Add color if it exists and is not already added
      if (row.color) {
        colorsSet.add(row.color);
      }
    });
    
    product.thumbnails = Array.from(thumbnailsMap.values());
    product.sizes = Array.from(sizesMap.values());
    product.colors = Array.from(colorsSet);
    
    res.json(product);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/createOrderTables', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        full_name TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        name TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        size TEXT,
        image TEXT
      )
    `);
    
    await client.query('COMMIT');
    
    res.status(200).send({ message: "Order tables created successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order tables:', err);
    res.status(500).send({ message: "Error creating order tables", error: err.message });
  } finally {
    client.release();
  }
});

app.post('/insertOrder', async (req, res) => {
  try {
    console.log('Starting order insertion');
    
    // Get order data from request body
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.items || !orderData.items.length) {
      console.log('Validation failed: No items in order');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    if (!orderData.totalAmount || !orderData.fullName || !orderData.address || 
        !orderData.city || !orderData.postalCode || !orderData.country || 
        !orderData.paymentMethod) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Missing required order information' });
    }

    // Begin a transaction
    const client = await pool.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert order into the orders table - let PostgreSQL generate the ID
      const orderQuery = `
        INSERT INTO orders (
          user_id,
          email, 
          full_name, 
          address, 
          city, 
          postal_code, 
          country, 
          payment_method, 
          total_amount, 
          status, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `;
      
      const orderValues = [
        orderData.userId || null,
        orderData.email,
        orderData.fullName,
        orderData.address,
        orderData.city,
        orderData.postalCode,
        orderData.country,
        orderData.paymentMethod,
        orderData.totalAmount,
        'pending'
      ];
      
      console.log('Inserting order:', orderValues);
      const orderResult = await client.query(orderQuery, orderValues);
      
      // Get the auto-generated order ID
      const insertedOrder = orderResult.rows[0];
      const orderId = insertedOrder.id;
      
      console.log(`Order ${orderId} created, inserting ${orderData.items.length} items`);
      
      // Insert each order item
      for (const item of orderData.items) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id,
            product_id,
            name,
            quantity,
            price,
            image
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        const itemValues = [
          orderId,
          item.productId,
          item.name,
          item.quantity,
          item.price,
          item.image || null
        ];
        
        await client.query(itemQuery, itemValues);
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Order transaction committed successfully');
      
      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        orderId: orderId,
        orderDate: insertedOrder.created_at
      });
    } catch (err) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      console.error('Transaction error:', err);
      return res.status(500).json({ error: err.message });
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/getOrders', async (req, res) => {
  const client = await pool.pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        o.id AS order_id,
        o.user_id,
        o.full_name,
        o.email,
        o.address,
        o.city,
        o.postal_code,
        o.country,
        o.payment_method,
        o.total_amount,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'name', oi.name,
            'price', oi.price,
            'quantity', oi.quantity,
            'size', oi.size,
            'image', oi.image
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id::TEXT = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send({ message: 'Error fetching orders', error: err.message });
  } finally {
    client.release();
  }
});

app.post('/updateOrderStatus', async (req, res) => {

  const { order_id, status } = req.body;

  // Validate the required parameters
  if (!order_id || !status) {
    return res.status(400).send({ 
      message: 'Missing required parameters', 
      details: 'Both order_id and status are required' 
    });
  }

  // Validate status value
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).send({ 
      message: 'Invalid status value', 
      details: `Status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  const client = await pool.pool.connect();
  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Update the order status in the database
    const updateQuery = `
      UPDATE orders
      SET status = $1, created_at = NOW()
      WHERE id = $2
      RETURNING id, status, created_at
    `;
    
    const result = await client.query(updateQuery, [status, order_id]);

    // Check if any rows were affected
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send({ message: 'Order not found' });
    }

    // Commit the transaction
    await client.query('COMMIT');

    // Return the updated order data
    res.status(200).send({
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating order status:', err);
    res.status(500).send({ 
      message: 'Error updating order status', 
      error: err.message 
    });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});  

// RESTful endpoint for fetching orders by user ID
app.get('/:userId/orders', async (req, res) => {
  // Get userId from URL parameter
  const userId = req.params.userId;

  console.log('Fetching orders for user:', userId);

  const client = await pool.pool.connect();
  try {
    // Query with parameter binding for security
    const result = await client.query(`
      SELECT 
        o.id AS order_id,
        o.user_id,
        o.full_name,
        o.email,
        o.address,
        o.city,
        o.postal_code,
        o.country,
        o.payment_method,
        o.total_amount,
        o.status,
        o.created_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'name', oi.name,
            'price', oi.price,
            'quantity', oi.quantity,
            'size', oi.size,
            'image', oi.image
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id::TEXT = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    console.log(`Found ${result.rowCount} orders for user ${userId}`);

    // Return the filtered orders
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ 
      message: 'Error fetching user orders', 
      error: err.message 
    });
  } finally {
    client.release();
  }
});

app.listen(port, ()=> console.log(`Server has started on port ${port}`))