// Cashfree Payment Integration
const initPayment = async (orderData) => {
    const cashfree = new Cashfree({
        mode: "TEST", // or "TEST" for sandbox mode
        appId: "TEST104848546d6226f17566d226543e45848401",
        secretKey: "cfsk_ma_test_cced2f2e16db9de7571e242d20fb95fe_4452b0be"
    });

    try {
        const order = await cashfree.createOrder({
            orderId: "ORDER_" + Date.now(),
            orderAmount: orderData.price,
            orderCurrency: "INR",
            customerName: orderData.customerName,
            customerEmail: orderData.email,
            customerPhone: orderData.phone,
            returnUrl: window.location.origin + "/payment-success.html",
            notifyUrl: window.location.origin + "/payment-webhook"
        });

        // Redirect to Cashfree payment page
        cashfree.redirect(order.paymentLink);
    } catch (error) {
        console.error("Payment initialization failed:", error);
        alert("Payment initialization failed. Please try again.");
    }
};

// Function to update UI after successful payment
const updateUIAfterPayment = (bookId) => {
    const buyButton = document.querySelector(`#buy-button-${bookId}`);
    if (buyButton) {
        buyButton.textContent = "Download";
        buyButton.onclick = () => downloadEbook(bookId);
        // Store purchase status in localStorage
        localStorage.setItem(`book_${bookId}_purchased`, 'true');
    }
};

// Function to download ebook
const downloadEbook = (bookId) => {
    // Add your download logic here
    const downloadLink = `path/to/ebooks/${bookId}.pdf`;
    window.open(downloadLink, '_blank');
};

// Check purchase status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get all buy buttons
    const buyButtons = document.querySelectorAll('[id^="buy-button-"]');
    buyButtons.forEach(button => {
        const bookId = button.id.replace('buy-button-', '');
        if (localStorage.getItem(`book_${bookId}_purchased`) === 'true') {
            updateUIAfterPayment(bookId);
        }
    });
}); 