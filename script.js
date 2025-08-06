// Calendar rendering and logic
const calendarContainer = document.getElementById('calendar-container');
const calendarHeader = document.getElementById('calendar-header');
const buttonContainer = document.getElementById('button-container');
const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const today = new Date();
let selectedDate = null;
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
const starImgUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

// Roulette variables
let isSpinning = false;
let spinInterval;
let currentRouletteDate = null;

// Child name and calendar switching logic
const child1Btn = document.getElementById('child1-btn');
const child2Btn = document.getElementById('child2-btn');
const child1NameSpan = document.getElementById('child1-name');
const child2NameSpan = document.getElementById('child2-name');
const child1Input = document.getElementById('child1-input');
const child2Input = document.getElementById('child2-input');

const DEFAULT_NAMES = ['아이1', '아이2'];
let childNames = [DEFAULT_NAMES[0], DEFAULT_NAMES[1]];
let currentChildIdx = 0;

function loadChildNames() {
    const saved = JSON.parse(localStorage.getItem('childNames') || 'null');
    if (saved && Array.isArray(saved) && saved.length === 2) {
        childNames = saved;
    }
    child1NameSpan.textContent = childNames[0];
    child2NameSpan.textContent = childNames[1];
}
function saveChildNames() {
    localStorage.setItem('childNames', JSON.stringify(childNames));
}

function getChildStarKey(idx) {
    return `starDates_${childNames[idx]}`;
}
function getChildScoreKey(idx) {
    return `rouletteScores_${childNames[idx]}`;
}

function getStarDatesForChild(idx) {
    return JSON.parse(localStorage.getItem(getChildStarKey(idx)) || '{}');
}
function setStarDatesForChild(idx, data) {
    localStorage.setItem(getChildStarKey(idx), JSON.stringify(data));
}
function getScoresForChild(idx) {
    return JSON.parse(localStorage.getItem(getChildScoreKey(idx)) || '{}');
}
function setScoresForChild(idx, data) {
    localStorage.setItem(getChildScoreKey(idx), JSON.stringify(data));
}

function switchChild(idx) {
    currentChildIdx = idx;
    child1Btn.classList.toggle('selected', idx === 0);
    child2Btn.classList.toggle('selected', idx === 1);
    // Load data for this child
    starDates = getStarDatesForChild(idx);
    scores = getScoresForChild(idx);
    renderCalendar(currentYear, currentMonth);
}

function handleChildBtnClick(idx) {
    // If input is visible, ignore
    if ((idx === 0 && child1Input.style.display === 'block') || (idx === 1 && child2Input.style.display === 'block')) return;
    switchChild(idx);
}

function handleChildBtnDblClick(idx) {
    // Show input for editing name
    if (idx === 0) {
        child1Input.value = childNames[0];
        child1Input.style.display = 'block';
        child1Input.focus();
    } else {
        child2Input.value = childNames[1];
        child2Input.style.display = 'block';
        child2Input.focus();
    }
}

function handleChildInputBlur(idx) {
    const input = idx === 0 ? child1Input : child2Input;
    let val = input.value.trim();
    if (!val) val = DEFAULT_NAMES[idx];
    childNames[idx] = val;
    saveChildNames();
    loadChildNames();
    input.style.display = 'none';
    // If name changed, migrate data if needed
    switchChild(currentChildIdx);
}

// Load star data and scores from localStorage
function getStarDates() { return getStarDatesForChild(currentChildIdx); }
function setStarDates(data) { setStarDatesForChild(currentChildIdx, data); }

function getScores() { return getScoresForChild(currentChildIdx); }
function setScores(data) { setScoresForChild(currentChildIdx, data); }

function populateYearMonthSelect(year, month) {
    // Year select: 10 years before and after current year
    const minYear = today.getFullYear() - 10;
    const maxYear = today.getFullYear() + 10;
    yearSelect.innerHTML = '';
    for (let y = minYear; y <= maxYear; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '년';
        if (y === year) opt.selected = true;
        yearSelect.appendChild(opt);
    }
    // Month select: 1~12
    monthSelect.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = (m + 1) + '월';
        if (m === month) opt.selected = true;
        monthSelect.appendChild(opt);
    }
}

function renderCalendar(year, month) {
    // Render year and month selects
    if (yearSelect && monthSelect) {
        populateYearMonthSelect(year, month);
    }

    // Render calendar grid
    calendarContainer.querySelector('.calendar')?.remove();
    const calendar = document.createElement('div');
    calendar.className = 'calendar';

    // Day names
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(day => {
        const dayElem = document.createElement('div');
        dayElem.textContent = day;
        dayElem.style.fontWeight = 'bold';
        dayElem.style.background = 'none';
        dayElem.style.color = '#1e3c72';
        calendar.appendChild(dayElem);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        calendar.appendChild(empty);
    }

    for (let date = 1; date <= lastDate; date++) {
        const dayElem = document.createElement('div');
        dayElem.className = 'calendar-day';
        dayElem.textContent = date;
        const key = `${year}-${month+1}-${date}`;
        
        if (starDates[key]) {
            const img = document.createElement('img');
            img.src = starImgUrl;
            img.className = 'star';
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.display = 'block';
            img.style.margin = '6px auto 0 auto';
            img.style.cursor = 'pointer';
            img.style.transition = 'transform 0.2s';
            img.style.filter = 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))';
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                openRoulette(key);
            });
            dayElem.appendChild(img);
            
            // Display score if exists
            if (scores[key]) {
                const scoreElem = document.createElement('div');
                scoreElem.className = 'score';
                scoreElem.textContent = `${scores[key]}점`;
                dayElem.appendChild(scoreElem);
            }
        }
        
        dayElem.addEventListener('click', () => selectDate(year, month, date, dayElem));
        calendar.appendChild(dayElem);
    }

    calendarContainer.appendChild(calendar);
}

function selectDate(year, month, date, elem) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(e => e.classList.remove('selected'));
    elem.classList.add('selected');
    selectedDate = { year, month, date };
    showButton();
}

function showButton() {
    let btn = document.getElementById('imdone-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'imdone-btn';
        btn.textContent = "I'm done!";
        btn.className = 'active';
        btn.addEventListener('click', markDone);
        buttonContainer.appendChild(btn);
    }
    btn.classList.add('active');
    btn.style.display = 'block';
}

function hideButton() {
    const btn = document.getElementById('imdone-btn');
    if (btn) {
        btn.classList.remove('active');
        btn.style.display = 'none';
    }
}

function markDone() {
    if (!selectedDate) return;
    const key = `${selectedDate.year}-${selectedDate.month+1}-${selectedDate.date}`;
    starDates[key] = true;
    setStarDates(starDates);
    renderCalendar(selectedDate.year, selectedDate.month);
    hideButton();
}

// Roulette functions
function openRoulette(dateKey) {
    currentRouletteDate = dateKey;
    const modal = document.getElementById('roulette-modal');
    modal.style.display = 'block';
    
    // Reset roulette state
    document.getElementById('spin-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('score-display').textContent = '';
    
    // Remove any existing highlights
    document.querySelectorAll('.roulette-item').forEach(item => {
        item.classList.remove('highlight');
    });
}

function closeRoulette() {
    const modal = document.getElementById('roulette-modal');
    modal.style.display = 'none';
    currentRouletteDate = null;
    stopSpinning();
}

function startSpinning() {
    if (isSpinning) return;
    
    isSpinning = true;
    document.getElementById('spin-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
    document.getElementById('score-display').textContent = '';
    
    const items = document.querySelectorAll('.roulette-item');
    let currentIndex = 0;
    
    spinInterval = setInterval(() => {
        // Remove previous highlight
        items.forEach(item => item.classList.remove('highlight'));
        
        // Add highlight to current item
        items[currentIndex].classList.add('highlight');
        
        // Move to next item
        currentIndex = (currentIndex + 1) % items.length;
    }, 200);
}

function stopSpinning() {
    if (!isSpinning) return;
    
    isSpinning = false;
    clearInterval(spinInterval);
    
    document.getElementById('spin-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    
    // Get the highlighted item
    const highlightedItem = document.querySelector('.roulette-item.highlight');
    if (highlightedItem) {
        const score = parseInt(highlightedItem.dataset.score);
        const starName = highlightedItem.querySelector('span').textContent.split(' ')[0];
        
        // Save score
        scores[currentRouletteDate] = score;
        setScores(scores);
        
        // Display result
        document.getElementById('score-display').textContent = 
            `축하합니다! ${starName}을(를) 획득했습니다! ${score}점 획득!`;
        
        // Re-render calendar to show new score
        const [year, month, date] = currentRouletteDate.split('-');
        renderCalendar(parseInt(year), parseInt(month) - 1);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadChildNames();
    switchChild(0);
    // Initial render: show this month
    renderCalendar(currentYear, currentMonth);

    // Year/month select change
    if (yearSelect && monthSelect) {
        yearSelect.addEventListener('change', function() {
            currentYear = parseInt(this.value);
            renderCalendar(currentYear, currentMonth);
        });
        monthSelect.addEventListener('change', function() {
            currentMonth = parseInt(this.value);
            renderCalendar(currentYear, currentMonth);
        });
    }
    // Prev/next month buttons
    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentYear, currentMonth);
        });
        nextMonthBtn.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentYear, currentMonth);
        });
    }

    // Roulette event listeners
    document.getElementById('spin-btn').addEventListener('click', startSpinning);
    document.getElementById('stop-btn').addEventListener('click', stopSpinning);
    document.getElementById('close-roulette').addEventListener('click', closeRoulette);
    
    // Close modal when clicking outside
    document.getElementById('roulette-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeRoulette();
        }
    });

    // Child name button listeners
    child1Btn.addEventListener('click', () => handleChildBtnClick(0));
    child2Btn.addEventListener('click', () => handleChildBtnClick(1));
    child1Btn.addEventListener('dblclick', () => handleChildBtnDblClick(0));
    child2Btn.addEventListener('dblclick', () => handleChildBtnDblClick(1));
    child1Input.addEventListener('blur', () => handleChildInputBlur(0));
    child2Input.addEventListener('blur', () => handleChildInputBlur(1));
    child1Input.addEventListener('keydown', e => { if (e.key === 'Enter') child1Input.blur(); });
    child2Input.addEventListener('keydown', e => { if (e.key === 'Enter') child2Input.blur(); });
});

// Hide button on click outside
calendarContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('calendar-day')) {
        hideButton();
    }
});