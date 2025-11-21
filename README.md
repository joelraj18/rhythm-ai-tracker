# Rhythm.AI | Neuro-Cognitive Productivity Engine

![Version](https://img.shields.io/badge/version-2.0.0-emerald)
![Tech](https://img.shields.io/badge/stack-React%20|%20Tailwind%20|%20Recharts-blue)
![Focus](https://img.shields.io/badge/science-Circadian%20Biology-purple)

**Rhythm.AI** is a professional-grade productivity tracker that utilizes **Cognitive Load Theory** and **Circadian Rhythms** to predict, track, and optimize your mental performance. unlike standard to-do lists, Rhythm.AI treats your energy as a finite biological resource.

---

## 🧠 The Science Behind The Code

This application runs on a custom **Neuro-Probabilistic Algorithm** that calculates your "Probability of Success" for future tasks based on three biological factors:

1.  **Circadian Nadir & Peaks:**
    * *Morning Cortisol Peak (8 AM - 11 AM):* The algorithm boosts probability scores.
    * *Post-Prandial Dip (1 PM - 3 PM):* The algorithm applies a statistical penalty to focus scores.
    * *Melatonin Onset (10 PM+):* Deep work probability decays rapidly.

2.  **Homeostatic Sleep Pressure:**
    * The system tracks "Allostatic Load." If you log high-intensity work (`Focus Level 5`) for 2+ hours, the predictive engine enforces a **Refractory Period**, lowering the probability of success for the next hour to prevent burnout.

3.  **Ultradian Rhythms:**
    * Optimized for 90-minute cycles. The "Neuro Tips" section provides protocols based on Andrew Huberman's research for managing these cycles.

---

## ⚡️ Command Line Interface (CLI)

To reduce friction and maintain "Flow State," Rhythm.AI uses a fast-entry command syntax inspired by Vim/Terminal workflows.

**Input Format:**
`[Start]^[End]%[Activity]%f[1-5]e[1-5]`

### Examples:

| Command | Meaning |
| :--- | :--- |
| `6a^7a%Morning Protocol%f5e4` | **6:00 AM - 7:00 AM**: "Morning Protocol" (High Focus, High Energy) |
| `8.5a^10a%Deep Work%f5e3` | **8:30 AM - 10:00 AM**: "Deep Work" (Auto-logs 1.5 hours) |
| `2p^4p%Admin Tasks%f2e3` | **2:00 PM - 4:00 PM**: "Admin Tasks" (Low Focus, Moderate Energy) |

---

## 📊 Features

* **Neuro-Probability Engine:** Real-time graph overlaying your actual performance vs. your biological predicted limit.
* **Multi-Hour Range Parsing:** Log huge blocks of time (e.g., "8a^12p") in a single second.
* **Decimal Time Support:** Precision logging for half-hour blocks (e.g., "6.5a" = 6:30 AM).
* **Local Persistence:** Data is encrypted via local storage keys (Siloed by User Email).
* **JSON Data Portability:** Full Export/Import capabilities for backup.
* **Huberman Protocols:** Built-in library of science-backed protocols for alertness and sleep.

---

## 🚀 Getting Started

### Prerequisites
* Node.js installed
* npm (Node Package Manager)

### Installation

```bash
# Clone the repository
git clone [https://github.com/joelraj18/rhythm-ai-tracker.git](https://github.com/joelraj18/rhythm-ai-tracker.git)

# Install dependencies
npm install

# Install Scientific Visualization Engines
npm install recharts lucide-react

# Run the Neuro-Engine
npm start