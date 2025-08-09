// Utils
const MAX_TRIALS = 10_000_000;
const MAX_ROWS = 1000;

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Simulation logic
function simulateSingleTrial() {
    const doors = [1, 2, 3];
    const car = pickRandom(doors);
    const player = pickRandom(doors);
    const montyChoices = doors.filter(d => d !== player && d !== car);
    const monty = pickRandom(montyChoices);
    const switchChoice = doors.find(d => d !== player && d !== monty);

    return {
        car,
        player,
        monty,
        switchChoice,
        switchWin: switchChoice === car,
        stayWin: player === car
    };
}

function simulateMontyHall(trials) {
    const results = [];
    let switchWins = 0;
    let stayWins = 0;

    for (let t = 1; t <= trials; t++) {
        const trial = simulateSingleTrial();
        if (trial.switchWin) switchWins++;
        if (trial.stayWin) stayWins++;
        trial.trial = t;
        results.push(trial);
    }

    return { trials, switchWins, stayWins, results };
}

// UI Rendering
function buildTableHtml(rows, maxDisplay) {
    if (!rows || rows.length === 0) return '';
    const displayRows = rows.slice(0, maxDisplay);
    let html = `<div style="overflow:auto; max-height:520px;">
    <table>
      <thead>
        <tr>
          <th>#</th><th>Car</th><th>Player pick</th><th>Monty opens</th><th>Switch pick</th><th>Switch win</th><th>Stay win</th>
        </tr>
      </thead>
      <tbody>`;

    for (const r of displayRows) {
        html += `<tr>
      <td>${r.trial}</td>
      <td>${r.car}</td>
      <td>${r.player}</td>
      <td>${r.monty}</td>
      <td>${r.switchChoice}</td>
      <td>${r.switchWin ? '✅' : '❌'}</td>
      <td>${r.stayWin ? '✅' : '❌'}</td>
    </tr>`;
    }

    html += '</tbody></table></div>';
    return html;
}

function updateSummary({ trials, switchWins, stayWins }) {
    const switchPct = ((switchWins / trials) * 100).toFixed(2);
    const stayPct = ((stayWins / trials) * 100).toFixed(2);

    document.getElementById('totalTrials').innerText = trials;
    document.getElementById('switchWins').innerText = switchWins;
    document.getElementById('stayWins').innerText = stayWins;
    document.getElementById('switchPct').innerText = `${switchPct}%`;
    document.getElementById('stayPct').innerText = `${stayPct}%`;
}

function toCSV(results) {
    if (!results || results.length === 0) return '';
    const headers = ['trial', 'car', 'player', 'monty', 'switchChoice', 'switchWin', 'stayWin'];
    const lines = [headers.join(',')];

    for (const r of results) {
        lines.push([
            r.trial,
            r.car,
            r.player,
            r.monty,
            r.switchChoice,
            r.switchWin ? '1' : '0',
            r.stayWin ? '1' : '0'
        ].join(','));
    }
    return lines.join('\n');
}

function showFloatingMessage(msg, duration = 3000) {
    const floatMsg = document.getElementById('floatMessage');
    floatMsg.textContent = msg;
    floatMsg.style.opacity = '1';
    floatMsg.style.pointerEvents = 'auto';

    setTimeout(() => {
        floatMsg.style.opacity = '0';
        floatMsg.style.pointerEvents = 'none';
    }, duration);
}

// Input validation helpers
function enforceMaxValue(input, maxVal, message) {
    let val = parseInt(input.value);
    if (val > maxVal) {
        input.value = maxVal;
        showFloatingMessage(message);
    }
}

// Main controller object to keep state and handlers together
const MontyHallController = {
    lastSimulation: null,

    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.trialsInput = document.getElementById('trials');
        this.showDetailsCheckbox = document.getElementById('showDetails');
        this.maxRowsInput = document.getElementById('maxRows');
        this.runBtn = document.getElementById('runBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.tableContainer = document.getElementById('tableContainer');
        this.notice = document.getElementById('notice');
        this.loading = document.getElementById('loading');
    },

    bindEvents() {
        this.runBtn.addEventListener('click', () => this.runSimulation());
        this.downloadBtn.addEventListener('click', () => this.downloadCSV());
        this.trialsInput.addEventListener('input', () => {
            enforceMaxValue(this.trialsInput, MAX_TRIALS, `Max trials is ${MAX_TRIALS}. Value adjusted.`);
        });
        this.maxRowsInput.addEventListener('input', () => {
            enforceMaxValue(this.maxRowsInput, MAX_ROWS, `Max rows is ${MAX_ROWS}. Value adjusted.`);
        });

        // Description toggle
        document.getElementById('descHeader').addEventListener('click', () => {
            const desc = document.getElementById('description');
            const arrow = document.getElementById('arrow');
            if (desc.style.display === 'none') {
                desc.style.display = 'block';
                arrow.style.transform = 'rotate(0deg)';
            } else {
                desc.style.display = 'none';
                arrow.style.transform = 'rotate(-90deg)';
            }
        });
    },

    async runSimulation() {
        // Clear UI
        this.clearOutput();

        const trials = parseInt(this.trialsInput.value) || 0;
        if (trials <= 0) {
            alert('Please enter a valid number of trials.');
            return;
        }

        this.showLoading(true);
        await new Promise(resolve => setTimeout(resolve, 50)); // Let UI update

        // Run simulation
        this.lastSimulation = simulateMontyHall(trials);

        // Update summary
        updateSummary(this.lastSimulation);

        // Render table if needed
        this.renderTable();

        this.showLoading(false);
    },

    renderTable() {
        if (this.showDetailsCheckbox.checked) {
            const maxRows = parseInt(this.maxRowsInput.value) || 200;
            const displayCount = Math.min(maxRows, this.lastSimulation.results.length);
            this.tableContainer.innerHTML = buildTableHtml(this.lastSimulation.results, displayCount);

            if (this.lastSimulation.results.length > displayCount) {
                this.notice.innerText = `Showing first ${displayCount} rows of ${this.lastSimulation.results.length}. Use "Max rows to display" to change. You can export the full data as CSV.`;
            } else {
                this.notice.innerText = '';
            }
        } else {
            this.tableContainer.innerHTML = '';
            this.notice.innerText = 'Details table is hidden. Enable "Show details table" to see per-trial rows.';
        }
    },

    clearOutput() {
        this.tableContainer.innerHTML = '';
        this.notice.innerText = '';
        document.getElementById('totalTrials').innerText = '—';
        document.getElementById('switchWins').innerText = '—';
        document.getElementById('stayWins').innerText = '—';
        document.getElementById('switchPct').innerText = '—';
        document.getElementById('stayPct').innerText = '—';
    },

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
    },

    downloadCSV() {
        if (!this.lastSimulation) {
            alert('Run a simulation first.');
            return;
        }
        const csv = toCSV(this.lastSimulation.results);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monty_hall_trials_${this.lastSimulation.trials}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Initialize everything on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    MontyHallController.init();
});
