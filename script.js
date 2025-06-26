// ATM System Variables
const users = [
    { pin: '1234', balance: 1500000 },
    { pin: '2024', balance: 2000000 },
    { pin: '5656', balance: 1750000 }
];

let currentUser = null;
let currentPin = '';
let pinAttempts = 0;
let transactionHistory = [];

const SALDO_MINIMUM = 50000;
const MAX_TRANSFER = 25000000;
const MAX_PENARIKAN = 5000000;

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function getCurrentTime() {
    return new Date().toLocaleString('id-ID');
}

function addToHistory(transaction) {
    const timestamp = getCurrentTime();
    transactionHistory.push({
        date: timestamp,
        transaction: transaction
    });
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyDiv = document.getElementById('transactionHistory');
    if (transactionHistory.length === 0) {
        historyDiv.innerHTML = '<div class="transaction-item"><div>Belum ada transaksi</div></div>';
        return;
    }

    historyDiv.innerHTML = transactionHistory.slice(-10).reverse().map((item, index) => `
        <div class="transaction-item">
            <div>${item.transaction}</div>
            <div class="transaction-date">${item.date}</div>
        </div>
    `).join('');
}

function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
    setTimeout(() => {
        errorDiv.innerHTML = '';
    }, 3000);
}

function showSuccess(elementId, message) {
    const successDiv = document.getElementById(elementId);
    successDiv.innerHTML = `<div class="success">✅ ${message}</div>`;
    setTimeout(() => {
        successDiv.innerHTML = '';
    }, 3000);
}

// Screen Management
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen > div');
    screens.forEach(screen => screen.classList.add('hidden'));
    
    // Show selected screen
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('fade-in');

    // Update balance display if showing balance screen
    if (screenId === 'balanceScreen') {
        document.getElementById('currentBalance').textContent = formatCurrency(currentUser.balance);
    }
}

// PIN Management
function inputPin(digit) {
    if (currentPin.length < 6) {
        currentPin += digit;
        updatePinDisplay();
    }
}

function clearPin() {
    currentPin = '';
    updatePinDisplay();
}

function updatePinDisplay() {
    const display = document.getElementById('pinDisplay');
    display.textContent = '*'.repeat(currentPin.length) || '****';
}

function submitPin() {
    if (currentPin.length < 4) {
        showError('pinError', 'PIN minimal 4 digit!');
        return;
    }

    const user = users.find(u => u.pin === currentPin);
    if (user) {
        currentUser = user;
        pinAttempts = 0;
        showSuccess('pinError', 'PIN benar! Selamat datang.');
        setTimeout(() => {
            showScreen('menuScreen');
        }, 1500);
    } else {
        pinAttempts++;
        if (pinAttempts >= 3) {
            showError('pinError', 'Rekening diblokir! Terlalu banyak percobaan salah.');
            setTimeout(() => {
                location.reload();
            }, 3000);
        } else {
            showError('pinError', `PIN salah! Sisa percobaan: ${3 - pinAttempts}`);
        }
    }
    
    currentPin = '';
    updatePinDisplay();
}

// Transaction Functions
function processTransfer() {
    const account = document.getElementById('transferAccount').value;
    const amount = parseInt(document.getElementById('transferAmount').value);

    // Validation
    if (!account || account.length < 10 || account.length > 16 || !/^\d+$/.test(account)) {
        showError('transferError', 'Nomor rekening tidak valid! Harus 10-16 digit angka.');
        return;
    }

    if (!amount || amount <= 0) {
        showError('transferError', 'Jumlah transfer harus lebih dari 0!');
        return;
    }

    if (amount > MAX_TRANSFER) {
        showError('transferError', `Jumlah transfer melebihi batas maksimum ${formatCurrency(MAX_TRANSFER)}!`);
        return;
    }

    if (amount > currentUser.balance) {
        showError('transferError', 'Saldo tidak mencukupi!');
        return;
    }

    if (currentUser.balance - amount < SALDO_MINIMUM) {
        showError('transferError', `Saldo setelah transfer tidak boleh kurang dari ${formatCurrency(SALDO_MINIMUM)}!`);
        return;
    }

    // Show confirmation
    showConfirmation('Transfer', amount, account, () => {
        currentUser.balance -= amount;
        addToHistory(`Transfer ke ${account}: ${formatCurrency(amount)}`);
        showReceipt('TRANSFER', amount, account);
        document.getElementById('transferAccount').value = '';
        document.getElementById('transferAmount').value = '';
    });
}

function processWithdraw(amount) {
    if (amount > MAX_PENARIKAN) {
        alert(`Jumlah penarikan melebihi batas maksimum ${formatCurrency(MAX_PENARIKAN)}!`);
        return;
    }

    if (amount > currentUser.balance) {
        alert('Saldo tidak mencukupi!');
        return;
    }

    if (currentUser.balance - amount < SALDO_MINIMUM) {
        alert(`Saldo setelah penarikan tidak boleh kurang dari ${formatCurrency(SALDO_MINIMUM)}!`);
        return;
    }

    showConfirmation('Penarikan Tunai', amount, '', () => {
        currentUser.balance -= amount;
        addToHistory(`Tarik Tunai: ${formatCurrency(amount)}`);
        showReceipt('PENARIKAN TUNAI', amount);
    });
}

function processCustomWithdraw() {
    const amount = parseInt(document.getElementById('customWithdrawAmount').value);

    if (!amount || amount <= 0) {
        showError('withdrawError', 'Nominal tidak valid!');
        return;
    }

    if (amount % 50000 !== 0) {
        showError('withdrawError', 'Nominal harus kelipatan Rp 50.000!');
        return;
    }

    if (amount > MAX_PENARIKAN) {
        showError('withdrawError', `Jumlah penarikan melebihi batas maksimum ${formatCurrency(MAX_PENARIKAN)}!`);
        return;
    }

    if (amount > currentUser.balance) {
        showError('withdrawError', 'Saldo tidak mencukupi!');
        return;
    }

    if (currentUser.balance - amount < SALDO_MINIMUM) {
        showError('withdrawError', `Saldo setelah penarikan tidak boleh kurang dari ${formatCurrency(SALDO_MINIMUM)}!`);
        return;
    }

    showConfirmation('Penarikan Tunai', amount, '', () => {
        currentUser.balance -= amount;
        addToHistory(`Tarik Tunai: ${formatCurrency(amount)}`);
        showReceipt('PENARIKAN TUNAI', amount);
        document.getElementById('customWithdrawAmount').value = '';
    });
}

function processDeposit() {
    const amount = parseInt(document.getElementById('depositAmount').value);

    if (!amount || amount < 10000) {
        showError('depositError', 'Nominal setor minimal Rp 10.000!');
        return;
    }

    showConfirmation('Setor Tunai', amount, '', () => {
        currentUser.balance += amount;
        addToHistory(`Setor Tunai: ${formatCurrency(amount)}`);
        showReceipt('SETOR TUNAI', amount);
        document.getElementById('depositAmount').value = '';
    });
}

function processChangePin() {
    const oldPin = document.getElementById('oldPin').value;
    const newPin = document.getElementById('newPin').value;
    const confirmPin = document.getElementById('confirmPin').value;

    if (oldPin !== currentUser.pin) {
        showError('changePinError', 'PIN lama salah!');
        return;
    }

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
        showError('changePinError', 'PIN baru harus 4-6 digit angka!');
        return;
    }

    if (newPin !== confirmPin) {
        showError('changePinError', 'Konfirmasi PIN tidak cocok!');
        return;
    }

    currentUser.pin = newPin;
    addToHistory('Ganti PIN berhasil');
    showSuccess('changePinError', 'PIN berhasil diubah!');
    
    // Clear form
    document.getElementById('oldPin').value = '';
    document.getElementById('newPin').value = '';
    document.getElementById('confirmPin').value = '';
    
    setTimeout(() => {
        showScreen('menuScreen');
    }, 2000);
}

// Confirmation and Receipt Functions
function showConfirmation(type, amount, target, callback) {
    const detailsDiv = document.getElementById('confirmationDetails');
    let details = `
        <div class="input-group">
            <label>Jenis Transaksi:</label>
            <div style="color: #3498db; font-weight: bold;">${type}</div>
        </div>
        <div class="input-group">
            <label>Jumlah:</label>
            <div style="color: #2ecc71; font-weight: bold;">${formatCurrency(amount)}</div>
        </div>
    `;
    
    if (target) {
        details += `
            <div class="input-group">
                <label>Tujuan:</label>
                <div style="color: #f39c12; font-weight: bold;">${target}</div>
            </div>
        `;
    }
    
    details += `
        <div class="input-group">
            <label>Saldo Sekarang:</label>
            <div style="color: #ecf0f1;">${formatCurrency(currentUser.balance)}</div>
        </div>
        <div class="input-group">
            <label>Saldo Setelah:</label>
            <div style="color: #e74c3c;">${formatCurrency(type === 'Setor Tunai' ? currentUser.balance + amount : currentUser.balance - amount)}</div>
        </div>
    `;
    
    detailsDiv.innerHTML = details;
    
    // Set button actions
    document.getElementById('confirmBtn').onclick = () => {
        callback();
        showScreen('receiptScreen');
    };
    
    document.getElementById('cancelBtn').onclick = () => {
        showScreen('menuScreen');
    };
    
    showScreen('confirmationScreen');
}

function showReceipt(type, amount, target = '') {
    const receiptDiv = document.getElementById('receiptContent');
    let receipt = `
        <div class="receipt-title">BANK SAAT - ATM RECEIPT</div>
        <div>${getCurrentTime()}</div>
        <hr style="margin: 10px 0;">
        <div><strong>Jenis Transaksi:</strong> ${type}</div>
        <div><strong>Jumlah:</strong> ${formatCurrency(amount)}</div>
    `;
    
    if (target) {
        receipt += `<div><strong>Tujuan:</strong> ${target}</div>`;
    }
    
    receipt += `
        <div><strong>Saldo Akhir:</strong> ${formatCurrency(currentUser.balance)}</div>
        <hr style="margin: 10px 0;">
        <div style="text-align: center;">
            <div>Terima kasih telah menggunakan</div>
            <div>layanan Bank Saat</div>
            <div style="margin-top: 10px;">⭐⭐⭐⭐⭐</div>
        </div>
    `;
    
    receiptDiv.innerHTML = receipt;
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        currentUser = null;
        currentPin = '';
        pinAttempts = 0;
        transactionHistory = [];
        showScreen('pinScreen');
        // Reset forms
        document.querySelectorAll('input').forEach(input => input.value = '');
        document.querySelectorAll('[id$="Error"]').forEach(div => div.innerHTML = '');
        updatePinDisplay();
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard support for PIN input
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('pinScreen').classList.contains('hidden')) return;
        
        if (e.key >= '0' && e.key <= '9') {
            inputPin(e.key);
        } else if (e.key === 'Enter') {
            submitPin();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            clearPin();
        }
    });
    
    // Add loading animation for transactions
    const originalShowConfirmation = showConfirmation;
    showConfirmation = function(type, amount, target, callback) {
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = '<div class="loading"></div> Memproses...';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.color = '#3498db';
        
        document.getElementById('confirmationDetails').innerHTML = '';
        document.getElementById('confirmationDetails').appendChild(loadingDiv);
        showScreen('confirmationScreen');
        
        setTimeout(() => {
            originalShowConfirmation(type, amount, target, callback);
        }, 1000);
    };
    
    // Auto-focus on input fields
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const screen = mutation.target;
                if (!screen.classList.contains('hidden')) {
                    const firstInput = screen.querySelector('input[type="text"], input[type="number"], input[type="password"]');
                    if (firstInput) {
                        setTimeout(() => firstInput.focus(), 100);
                    }
                }
            }
        });
    });
    
    document.querySelectorAll('.screen > div').forEach(screen => {
        observer.observe(screen, { attributes: true });
    });
    
    // Add Enter key support for forms
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const screen = this.closest('[id$="Screen"]');
                const submitBtn = screen.querySelector('.btn-success');
                if (submitBtn) {
                    submitBtn.click();
                }
            }
        });
    });
    
    // Initialize PIN display
    updatePinDisplay();
    
    console.log('🏧 Bank Saat ATM System berhasil dimuat!');
    console.log('📝 PIN tersedia: 1234, 2024, 5656');
});
