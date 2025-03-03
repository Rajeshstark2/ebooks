// Cashfree Payment Integration
const initPayment = async (orderData) => {
    try {
        console.log('Starting payment initialization with data:', orderData);

        // Check if Cashfree SDK is loaded
        if (typeof Cashfree === 'undefined') {
            console.error('Cashfree SDK not loaded');
            throw new Error('Cashfree SDK not loaded. Please refresh the page and try again.');
        }

        console.log('Creating order on backend...');
        // First, get order token from your backend
        const orderResponse = await fetch('http://localhost:3000/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderAmount: orderData.price,
                customerName: orderData.customerName,
                customerEmail: orderData.email,
                customerPhone: orderData.phone,
                bookId: orderData.bookId
            })
        });

        const responseData = await orderResponse.json();
        console.log('Backend response:', responseData);

        if (!orderResponse.ok) {
            console.error('Order creation failed:', responseData);
            throw new Error(responseData.error || 'Failed to create order');
        }

        const { orderToken, orderId } = responseData;
        console.log('Order created successfully. OrderId:', orderId, 'Token:', orderToken);

        // Store bookId for later use
        localStorage.setItem('last_purchased_book', orderData.bookId);

        // Initialize Cashfree checkout in production mode
        const cashfree = Cashfree({ mode: "production" });

        // Configure payment
        const paymentConfig = {
            components: ["order-details", "card", "upi", "netbanking"],
            style: {
                theme: "light"
            }
        };

        // Show payment UI
        cashfree.checkout({
            paymentSessionId: orderToken,
            returnUrl: `http://localhost:3000/payment-success.html?order_id=${orderId}&book_id=${orderData.bookId}`
        });

    } catch (error) {
        console.error("Payment initialization failed:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            response: error.response
        });
        alert(`Payment initialization failed: ${error.message}. Please check the console for more details.`);
    }
};

// Book catalog with prices and details
const BOOK_CATALOG = {
    book1: {
        id: 'book1',
        title: 'Windows Registry Forensics',
        price: '150.00',
        originalPrice: '999.00',
        author: 'Harlan Carvey',
        downloadPath: '/ebooks/book1.pdf',
        coverImage: 'img23.jpg'
    },
    book2: {
        id: 'book2',
        title: 'Penetration Testing',
        price: '299.00',
        originalPrice: '1099.00',
        author: 'Georgia Weidman',
        downloadPath: '/ebooks/book2.pdf',
        coverImage: 'img2.jpg'
    },
    book3: {
        id: 'book3',
        title: 'Windows Virus and Malware Troubleshooting',
        price: '136.00',
        originalPrice: '1999.00',
        author: 'Andrew Bettany',
        downloadPath: '/ebooks/book3.pdf',
        coverImage: 'img8.jpg'
    },
    book4: {
        id: 'book4',
        title: 'Writing an Effective Penetration Test Report',
        price: '199.00',
        originalPrice: '1099.00',
        author: 'Hammad Arshed',
        downloadPath: '/ebooks/book4.pdf',
        coverImage: 'img7.jpg'
    },
    book5: {
        id: 'book5',
        title: 'Operating System Concepts (9th Edition)',
        price: '299.00',
        originalPrice: '1539.00',
        author: 'Abraham Silberschatz',
        downloadPath: '/ebooks/book5.pdf',
        coverImage: 'img3.jpg'
    },
    book6: {
        id: 'book6',
        title: 'Web Security Testing Guide',
        price: '239.00',
        originalPrice: '1099.00',
        author: 'Rick Mitchell',
        downloadPath: '/ebooks/book6.pdf',
        coverImage: 'img4.jpg'
    },
    book7: {
        id: 'book7',
        title: 'Web Hacking',
        price: '287.00',
        originalPrice: '999.00',
        author: 'Peter Yaworski',
        downloadPath: '/ebooks/book7.pdf',
        coverImage: 'img6.jpg'
    },
    book8: {
        id: 'book8',
        title: 'Web Hacking Arsenal',
        price: '20.00',
        originalPrice: '1156.00',
        author: 'Rafay Baloch',
        downloadPath: '/ebooks/book8.pdf',
        coverImage: 'img5.jpg'
    }
};

// Utility Functions
function downloadEbook(bookId, orderId) {
    if (!bookId || !orderId) {
        console.error('Missing book ID or order ID for download');
        return;
    }
    
    const book = BOOK_CATALOG[bookId];
    if (!book) {
        console.error('Book not found:', bookId);
        return;
    }

    console.log('Downloading book:', bookId, 'Order:', orderId);
    
    // Use the actual downloadPath from the book catalog
    const downloadUrl = book.downloadPath + `?orderId=${orderId}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `${book.title}.pdf`; // Set suggested filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateUIAfterPayment(bookId, orderId) {
    console.log('Updating UI for purchased book:', bookId, 'Order:', orderId);
    
    const buyButton = document.querySelector(`#buy-button-${bookId}`);
    if (buyButton) {
        // Update button for specific book only
        buyButton.textContent = "Download";
        buyButton.onclick = () => {
            const storedOrderId = localStorage.getItem(`order_${bookId}`);
            downloadEbook(bookId, storedOrderId);
        };
        
        // Hide price elements for this specific book
        const bookInfo = buyButton.closest('.book-info');
        if (bookInfo) {
            const priceElement = bookInfo.querySelector('.final-price');
            const originalPriceElement = bookInfo.querySelector('.prev-price');
            if (priceElement) priceElement.style.display = 'none';
            if (originalPriceElement) originalPriceElement.style.display = 'none';
        }
    }
}

// Animation functions
function countAnimation(targetNumber, elementId) {
    var currentNumber = 0;
    var increment = Math.ceil(targetNumber / 250);
    var intervalTime = 20;

    var interval = setInterval(function() {
        currentNumber += increment;
        if (currentNumber >= targetNumber) {
            clearInterval(interval);
            currentNumber = targetNumber;
        }
        document.getElementById(elementId).textContent = currentNumber.toLocaleString() + '+';
    }, intervalTime);
}

// Payment Functions
function closePaymentForm() {
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.remove();
    }
}

function showPaymentForm(bookData) {
    const book = BOOK_CATALOG[bookData.id];
    if (!book) return;

    const modal = document.getElementById('customer-form-modal');
    const bookImage = document.getElementById('selected-book-image');
    const bookTitle = document.getElementById('selected-book-title');
    const bookPrice = document.getElementById('selected-book-price');
    
    // Set book details in the form
    bookImage.src = book.coverImage;  // Use the coverImage property
    bookTitle.textContent = book.title;
    bookPrice.textContent = `₹${book.price}`;
    
    modal.style.display = 'block';
    
    // Store selected book data
    window.selectedBook = book;
}

// Theme switching functionality
function initializeThemeSwitch() {
    const checkbox = document.querySelector("#hide_checkbox");
    const gitLogo = document.getElementById("gitlogo");
    const footerLogo = document.getElementById("footerLogo");
    const topLogo = document.getElementById("topLogo");

    if (checkbox) {
        checkbox.addEventListener("click", () => {
            const body = document.body;
            if (checkbox.checked) {
                body.classList.add("dark");
                body.classList.remove("light");
                if (gitLogo) gitLogo.src = "images/github-dark.webp";
                if (footerLogo) footerLogo.src = "images/logo.webp";
                if (topLogo) topLogo.src = "images/logo.webp";
            } else {
                body.classList.remove("dark");
                body.classList.add("light");
                if (gitLogo) gitLogo.src = "images/github-light.webp";
                if (footerLogo) footerLogo.src = "images/logo_dark.webp";
                if (topLogo) topLogo.src = "images/logo_dark.webp";
            }
        });
    }
}

// Add styles for payment modal
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
    .payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .payment-form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
    }
    .form-group {
        margin-bottom: 1rem;
    }
    .form-group input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    .submit-btn, .cancel-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 1rem;
    }
    .submit-btn {
        background: #007bff;
        color: white;
    }
    .cancel-btn {
        background: #dc3545;
        color: white;
    }
`;
document.head.appendChild(paymentStyles);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start animations
    countAnimation(100000, 'count1');
    countAnimation(20, 'count2');

    // Initialize theme switching
    initializeThemeSwitch();

    // Check for any books purchased in this session
    const lastPurchasedBook = localStorage.getItem('last_purchased_book');
    if (lastPurchasedBook) {
        updateUIAfterPayment(lastPurchasedBook, localStorage.getItem(`order_${lastPurchasedBook}`));
        localStorage.removeItem('last_purchased_book'); // Clean up
    }

    // Initialize book buttons and prices
    Object.values(BOOK_CATALOG).forEach(book => {
        const buyButton = document.querySelector(`#buy-button-${book.id}`);
        const priceElement = buyButton?.closest('.book-info')?.querySelector('.final-price');
        const originalPriceElement = buyButton?.closest('.book-info')?.querySelector('.prev-price');
        
        if (buyButton) {
            // Check if this specific book is purchased
            const isPurchased = localStorage.getItem(`book_${book.id}_purchased`) === 'true';
            const orderId = localStorage.getItem(`order_${book.id}`);
            
            if (isPurchased && orderId) {
                console.log('Found purchased book:', book.id, 'Order:', orderId);
                buyButton.textContent = "Download";
                buyButton.onclick = () => downloadEbook(book.id, orderId);
                
                // Hide prices for purchased book
                if (priceElement) priceElement.style.display = 'none';
                if (originalPriceElement) originalPriceElement.style.display = 'none';
            } else {
                // Show buy button for non-purchased books
                if (priceElement) {
                    priceElement.textContent = `₹${book.price}`;
                }
                if (originalPriceElement) {
                    originalPriceElement.textContent = `₹${book.originalPrice}`;
                }
                buyButton.onclick = () => showPaymentForm(book);
            }
        }
    });
});
