import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaChartLine, FaChartBar, FaChartPie, FaUndo } from 'react-icons/fa';
import Sidebar from '@/components/sidebar';

const StartupAnalytics = () => {
  // État pour les données de levée de fonds
  const [fundingData, setFundingData] = useState({
    semesters: [
      { name: 'S1 ', target: 500000, raised: 0},
      { name: 'S2 ', target: 500000, raised: 0 },
      { name: 'S3 ', target: 1000000, raised: 0 },
      { name: 'S4 ', target: 1000000, raised: 0 },
    ],
    totalRaised:  0,
    totalTarget: 3000000,
  });

  // État pour le popup
  const [showPopup, setShowPopup] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(0); // S2 2024 par défaut
  const [fundingAmount, setFundingAmount] = useState('');

  // Calcul des pourcentages
  const calculatePercentages = () => {
    return fundingData.semesters.map(semester => ({
      ...semester,
      percentage: Math.min(100, (semester.raised / semester.target) * 100)
    }));
  };

  const [percentages, setPercentages] = useState(calculatePercentages());

  // Mettre à jour les pourcentages quand les données changent
  useEffect(() => {
    setPercentages(calculatePercentages());
  }, [fundingData]);

  // Gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(fundingAmount);
    if (isNaN(amount) || amount < 0) return;

    const updatedSemesters = [...fundingData.semesters];
    updatedSemesters[currentSemester].raised += amount;

    const newTotalRaised = fundingData.totalRaised + amount;

    setFundingData({
      ...fundingData,
      semesters: updatedSemesters,
      totalRaised: newTotalRaised
    });

    // Réinitialiser et fermer le popup
    setFundingAmount('');
    setShowPopup(false);
  };

  // Réinitialiser toutes les données
  const resetData = () => {
    setFundingData({
      semesters: [
        { name: 'S1 ', target: 500000, raised: 0 },
        { name: 'S2 ', target: 500000, raised: 0 },
        { name: 'S3 ', target: 1000000, raised: 0 },
        { name: 'S4 ', target: 1000000, raised: 0 },
      ],
      totalRaised: 0,
      totalTarget: 3000000,
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="analytics-container">
          {/* Header */}
          <header className="analytics-header">
            <h1><FaChartLine /> Analytics Dashboard</h1>
            <div className="header-actions">
              <button
                className="add-funding-btn"
                onClick={() => setShowPopup(true)}
              >
                <FaMoneyBillWave /> Ajouter une levée de fonds
              </button>
              <button
                className="reset-btn"
                onClick={resetData}
              >
                <FaUndo /> Réinitialiser
              </button>
            </div>
          </header>

          {/* KPI Cards */}
          <section className="kpi-section">
            <div className="kpi-card">
              <h3>Levée totale</h3>
              <div className="kpi-value">
                {(fundingData.totalRaised / 1000).toFixed(0)}k DA
              </div>
              <div className="kpi-progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${(fundingData.totalRaised / fundingData.totalTarget) * 100}%`
                  }}
                ></div>
              </div>
              <div className="kpi-target">
                Objectif: {(fundingData.totalTarget / 1000).toFixed(0)}k DA
              </div>
            </div>

            <div className="kpi-card">
              <h3>Progression globale</h3>
              <div className="kpi-value">
                {((fundingData.totalRaised / fundingData.totalTarget) * 100).toFixed(1)}%
              </div>
              <div className="kpi-description">
                {fundingData.totalRaised >= fundingData.totalTarget
                  ? 'Objectif atteint !'
                  : 'En cours de réalisation'}
              </div>
            </div>
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            <div className="chart-container bar-chart">
              <h3><FaChartBar /> Levée de fonds par semestre</h3>
              <div className="chart-content">
                {percentages.map((semester, index) => (
                  <div key={index} className="bar-group">
                    <div className="bar-labels">
                      <span>{semester.name}</span>
                      <span>{semester.raised.toLocaleString()} DA / {semester.target.toLocaleString()} DA</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{ width: `${semester.percentage}%` }}
                      ></div>
                    </div>
                    <div className="bar-percentage">
                      {semester.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container pie-chart">
              <h3><FaChartPie /> Répartition des fonds levés</h3>
              <div className="pie-chart-visual">
                {percentages.filter(s => s.raised > 0).map((semester, index) => {
                  const totalRaised = fundingData.semesters.reduce((sum, s) => sum + s.raised, 0);
                  const percentage = totalRaised > 0 ? (semester.raised / totalRaised) * 100 : 0;
                  const rotation = percentages.slice(0, index).reduce((sum, s) => {
                    const sPercentage = totalRaised > 0 ? (s.raised / totalRaised) * 100 : 0;
                    return sum + sPercentage;
                  }, 0);

                  return (
                    <div
                      key={index}
                      className="pie-segment"
                      style={{
                        background: `conic-gradient(
                          var(--color-${index}) ${rotation}deg ${rotation + percentage}deg,
                          transparent ${rotation + percentage}deg 360deg
                        )`
                      }}
                    ></div>
                  );
                })}
                <div className="pie-center">
                  <div>Total</div>
                  <div>{(fundingData.totalRaised / 1000).toFixed(0)}k DA</div>
                </div>
              </div>
              <div className="pie-legend">
                {percentages.filter(s => s.raised > 0).map((semester, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: `var(--color-${index})` }}></span>
                    <span>{semester.name}: {(semester.raised / 1000).toFixed(0)}k DA</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Popup pour ajouter une levée de fonds */}
          {showPopup && (
            <div className="popup-overlay">
              <div className="funding-popup">
                <h2>Ajouter une levée de fonds</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Semestre:</label>
                    <select
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(parseInt(e.target.value))}
                    >
                      {fundingData.semesters.map((semester, index) => (
                        <option
                          key={index}
                          value={index}
                          disabled={semester.raised >= semester.target}
                        >
                          {semester.name} {semester.raised >= semester.target ? '(Complet)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Montant (DA):</label>
                    <input
                      type="number"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="Entrez le montant levé"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowPopup(false)}>
                      Annuler
                    </button>
                    <button type="submit" className="confirm-btn">
                      Confirmer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Styles */}
          <style jsx>{`
            .analytics-container {
              padding: 2rem;
              padding-top: 100px; /* Add padding to account for the navbar height */
              min-height: 100vh;
              background-color: #f8f9fa;
              margin-left: 280px; /* Ajustement pour la barre latérale */
              width: calc(100% - 280px); /* Largeur totale moins la barre latérale */
            }

            .analytics-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid #e0e0e0;
            }

            .analytics-header h1 {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              color: #2c3e50;
            }

            .header-actions {
              display: flex;
              gap: 1rem;
            }

            button {
              padding: 0.5rem 1rem;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-weight: 500;
              transition: all 0.2s ease;
            }

            .add-funding-btn {
              background-color: #3498db;
              color: white;
            }

            .add-funding-btn:hover {
              background-color: #2980b9;
            }

            .reset-btn {
              background-color: #e74c3c;
              color: white;
            }

            .reset-btn:hover {
              background-color: #c0392b;
            }

            /* KPI Section */
            .kpi-section {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 1.5rem;
              margin-bottom: 2rem;
            }

            .kpi-card {
              background: white;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }

            .kpi-card h3 {
              color: #7f8c8d;
              font-size: 1rem;
              margin-bottom: 0.5rem;
            }

            .kpi-value {
              font-size: 2rem;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 1rem;
            }

            .kpi-progress {
              height: 8px;
              background-color: #ecf0f1;
              border-radius: 4px;
              margin-bottom: 0.5rem;
              overflow: hidden;
            }

            .progress-bar {
              height: 100%;
              background-color: #2ecc71;
              border-radius: 4px;
            }

            .kpi-target {
              color: #7f8c8d;
              font-size: 0.9rem;
            }

            .kpi-description {
              color: #7f8c8d;
              font-size: 0.9rem;
              font-style: italic;
            }

            /* Charts Section */
            .charts-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              margin-bottom: 2rem;
            }

            @media (max-width: 1200px) {
              .analytics-container {
                margin-left: 0;
                width: 100%;
                padding: 1rem;
                padding-top: 100px; /* Maintain padding for navbar on mobile */
              }

              .charts-section {
                grid-template-columns: 1fr;
              }
            }

            @media (max-width: 768px) {
              .analytics-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
              }

              .header-actions {
                width: 100%;
                flex-direction: column;
              }

              .header-actions button {
                width: 100%;
              }

              .kpi-section {
                grid-template-columns: 1fr;
              }
            }

            .chart-container {
              background: white;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }

            .chart-container h3 {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              color: #2c3e50;
              margin-bottom: 1.5rem;
            }

            /* Bar Chart */
            .bar-group {
              margin-bottom: 1.5rem;
            }

            .bar-labels {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.3rem;
              font-size: 0.9rem;
              color: #7f8c8d;
            }

            .bar-container {
              height: 20px;
              background-color: #ecf0f1;
              border-radius: 10px;
              overflow: hidden;
            }

            .bar {
              height: 100%;
              background-color: #3498db;
              border-radius: 10px;
              transition: width 0.5s ease;
            }

            .bar-percentage {
              text-align: right;
              font-size: 0.8rem;
              color: #7f8c8d;
              margin-top: 0.3rem;
            }

            /* Pie Chart */
            .pie-chart-visual {
              position: relative;
              width: 200px;
              height: 200px;
              border-radius: 50%;
              margin: 0 auto 1.5rem;
              background: #ecf0f1;
            }

            .pie-segment {
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              clip-path: circle(50% at 50% 50%);
            }

            .pie-center {
              position: absolute;
              width: 80px;
              height: 80px;
              background: white;
              border-radius: 50%;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-size: 0.8rem;
              color: #2c3e50;
              box-shadow: 0 0 5px rgba(0,0,0,0.1);
            }

            .pie-legend {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              justify-content: center;
            }

            .legend-item {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.9rem;
            }

            .legend-color {
              width: 15px;
              height: 15px;
              border-radius: 3px;
            }

            /* Popup Styles */
            .popup-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0,0,0,0.5);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
            }

            .funding-popup {
              background: white;
              border-radius: 8px;
              padding: 2rem;
              width: 100%;
              max-width: 500px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }

            .funding-popup h2 {
              margin-bottom: 1.5rem;
              color: #2c3e50;
            }

            .form-group {
              margin-bottom: 1.5rem;
            }

            .form-group label {
              display: block;
              margin-bottom: 0.5rem;
              color: #7f8c8d;
            }

            .form-group select,
            .form-group input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 1rem;
            }

            .form-actions {
              display: flex;
              justify-content: flex-end;
              gap: 1rem;
              margin-top: 2rem;
            }

            .form-actions button {
              padding: 0.75rem 1.5rem;
            }

            .confirm-btn {
              background-color: #2ecc71;
              color: white;
            }

            .confirm-btn:hover {
              background-color: #27ae60;
            }

            /* Couleurs pour les segments du pie chart */
            :root {
              --color-0: #3498db;
              --color-1: #e74c3c;
              --color-2: #2ecc71;
              --color-3: #f39c12;
              --color-4: #9b59b6;
              --color-5: #1abc9c;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default StartupAnalytics;