document.getElementById('scrapeBtn').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value.trim();
    const resultsDiv = document.getElementById('results');
    
    if (!url) {
        resultsDiv.innerHTML = '<p class="error">Please enter a URL</p>';
        return;
    }

    resultsDiv.innerHTML = '<p>Scraping... Please wait.</p>';

    try {
        // Use CORS proxy to avoid access issues
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const response = await fetch(proxyUrl + url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const products = parseProducts(html);
        displayResults(products);
    } catch (error) {
        resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
});

function parseProducts(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const products = [];
    
    const productGrid = doc.querySelector('.product-grid');
    if (!productGrid) return products;
    
    productGrid.querySelectorAll('.prbox_box').forEach(product => {
        const productData = {
            name: product.querySelector('.prbox_name')?.textContent.trim() || null,
            sales_points: Array.from(product.querySelectorAll('.prbox_salespoints li')).map(li => li.textContent.trim()),
            badges: Array.from(product.querySelectorAll('.prbox_badges li')).map(li => li.textContent.trim()),
            sale_price: product.querySelector('.prbox_pricebox .saleprice')?.textContent.trim() || null,
            was_price: product.querySelector('.prbox_pricebox .wasprice')?.textContent.trim() || null,
            stock_status: Array.from(product.querySelectorAll('.prbox_icon')).map(icon => {
                const tooltip = icon.querySelector('.tooltip');
                return tooltip ? tooltip.textContent.trim() : null;
            }).filter(Boolean),
            image_url: parseImageUrl(product),
            product_url: product.querySelector('.prbox_link')?.href || null
        };
        products.push(productData);
    });
    
    return products;
}

function parseImageUrl(product) {
    if (product.dataset.lazy) {
        const match = product.dataset.lazy.match(/url\((.*?)\)/);
        return match ? match[1] : null;
    }
    return null;
}

function displayResults(products) {
    const resultsDiv = document.getElementById('results');
    
    if (products.length === 0) {
        resultsDiv.innerHTML = '<p>No products found.</p>';
        return;
    }

    resultsDiv.innerHTML = `<p>Found ${products.length} products:</p>`;
    
    products.forEach((product, idx) => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
            <h3>Product #${idx + 1}: ${product.name || 'Untitled'}</h3>
            ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : ''}
            <p><strong>Sale Price:</strong> ${product.sale_price || 'N/A'}</p>
            ${product.was_price ? `<p><strong>Was:</strong> ${product.was_price}</p>` : ''}
            <p><strong>URL:</strong> <a href="${product.product_url}" target="_blank">View Product</a></p>
            ${product.sales_points.length ? `<p><strong>Features:</strong><br>${product.sales_points.join('<br>')}</p>` : ''}
            ${product.badges.length ? `<p><strong>Badges:</strong> ${product.badges.join(', ')}</p>` : ''}
            ${product.stock_status.length ? `<p><strong>Stock:</strong> ${product.stock_status.join(', ')}</p>` : ''}
        `;
        resultsDiv.appendChild(productDiv);
    });
}
