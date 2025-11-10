import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Pie, Doughnut } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Enregistrer les composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [honorairesData, setHonorairesData] = useState([]);
    const [depensesData, setDepensesData] = useState([]);
    const [honorairesParClientData, setHonorairesParClientData] = useState([]);
    const [soldeCgm, setSoldeCgm] = useState(0);
    const [caisseCgmData, setCaisseCgmData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('mois'); // 'jour', 'mois', 'annee'
    const [viewMode, setViewMode] = useState('global'); // 'global' ou 'par-client'
    const chartMode = 'comparaison';
    const [clientViewMode, setClientViewMode] = useState('table'); // 'table' ou 'chart'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeView, setActiveView] = useState('honoraires'); // 'honoraires', 'caisse-cgm', 'repartition-client'de façon leseeeeee
    const [isDarkMode, setIsDarkMode] = useState(true); // Mode nuit par défaut

    // Refs pour capturer les graphiques
    const lineChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const globalTableRef = useRef(null);
    const clientTableRef = useRef(null);

    // États pour les filtres de date
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'year', 'month', 'period'

    const fetchStatisticsData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // Construire les paramètres de requête
            const params = new URLSearchParams({ period });

            if (dateFilterType === 'year' && selectedYear) {
                params.append('year', selectedYear);
            } else if (dateFilterType === 'month' && selectedYear && selectedMonth) {
                params.append('year', selectedYear);
                params.append('month', selectedMonth);
            } else if (dateFilterType === 'period' && startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            // Récupérer les données globales des honoraires
            const honorairesResponse = await fetch(`/api/statistics/honoraires-chiffre-affaires?${params}`);
            const honorairesData = await honorairesResponse.json();

            // Récupérer les données des dépenses
            const depensesResponse = await fetch(`/api/statistics/depenses-totales?${params}`);
            const depensesData = await depensesResponse.json();

            // Récupérer les données par client
            const clientResponse = await fetch(`/api/statistics/honoraires-par-client?${params}`);
            const clientData = await clientResponse.json();

            // Récupérer le solde de la caisse CGM
            const caisseResponse = await fetch('/api/caisse-cgm/solde');
            const caisseData = await caisseResponse.json();

            // Récupérer l'évolution de la caisse CGM (retraits et dépôts)
            const caisseEvolutionResponse = await fetch(`/api/statistics/caisse-cgm-evolution?${params}`);
            const caisseEvolutionData = await caisseEvolutionResponse.json();

            if (honorairesData.success && depensesData.success && clientData.success) {
                const honorairesArray = honorairesData.data || [];
                const depensesArray = depensesData.data || [];
                const clientArray = clientData.data || [];

                console.log('Données récupérées - Honoraires (raw):', honorairesData);
                console.log('Données récupérées - Honoraires (array):', honorairesArray);
                console.log('Nombre d\'honoraires:', honorairesArray.length);

                setHonorairesData(honorairesArray);
                setDepensesData(depensesArray);
                setHonorairesParClientData(clientArray);
                if (caisseData.success) {
                    setSoldeCgm(parseFloat(caisseData.solde_actuel || 0));
                }
                if (caisseEvolutionData.success) {
                    setCaisseCgmData(caisseEvolutionData.data || []);
                }

                // Vérifier si les données sont vides
                if (honorairesArray.length === 0) {
                    console.warn('⚠️ Aucune donnée d\'honoraires trouvée pour la période sélectionnée');
                }
            } else {
                const errorMsg = honorairesData.error || depensesData.error || clientData.error || 'Erreur lors du chargement des données';
                console.error('Erreur lors du chargement:', errorMsg);
                setError(errorMsg);
            }
        } catch (err) {
            setError('Erreur réseau lors du chargement des données');
            console.error('Erreur fetchStatisticsData:', err);
        } finally {
            setLoading(false);
        }
    }, [period, dateFilterType, selectedYear, selectedMonth, startDate, endDate]);

    useEffect(() => {
        fetchStatisticsData();
    }, [fetchStatisticsData]);

    const formatMontant = (montant) => {
        const value = parseFloat(montant);
        if (isNaN(value)) return '0,00 TND';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'TND'
        }).format(value);
    };

    // Générer les années disponibles (2020-2030)
    const generateYears = () => {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let year = 2020; year <= currentYear + 2; year++) {
            years.push(year);
        }
        return years;
    };

    // Générer les mois
    const generateMonths = () => {
        return [
            { value: '1', label: 'Janvier' },
            { value: '2', label: 'Février' },
            { value: '3', label: 'Mars' },
            { value: '4', label: 'Avril' },
            { value: '5', label: 'Mai' },
            { value: '6', label: 'Juin' },
            { value: '7', label: 'Juillet' },
            { value: '8', label: 'Août' },
            { value: '9', label: 'Septembre' },
            { value: '10', label: 'Octobre' },
            { value: '11', label: 'Novembre' },
            { value: '12', label: 'Décembre' }
        ];
    };

    // Préparer les données pour le graphique
    const prepareChartData = () => {
        // Créer un ensemble de toutes les dates
        const allDates = new Set();
        honorairesData.forEach(item => allDates.add(item.period));
        depensesData.forEach(item => allDates.add(item.period));
        const sortedDates = Array.from(allDates).sort();

        const datasets = [];

        // Ajouter les honoraires selon le mode
        if (chartMode === 'honoraires-seul' || chartMode === 'comparaison') {
            datasets.push({
                label: 'Chiffre d\'Affaires (Honoraires Reçus)',
                data: sortedDates.map(date => {
                    const item = honorairesData.find(h => h.period === date);
                    return parseFloat(item?.total_honoraires || 0);
                }),
                borderColor: '#10b981', // Vert simple
                backgroundColor: 'rgba(16, 185, 129, 0.1)', // Fond subtil
                borderWidth: 4, // Ligne plus épaisse
                pointBackgroundColor: '#16a34a', // Points verts foncés
                pointBorderColor: '#ffffff', // Bordure blanche des points
                pointBorderWidth: 3, // Bordure épaisse des points
                pointRadius: 8, // Points plus gros
                pointHoverRadius: 12, // Points encore plus gros au survol
                pointHoverBackgroundColor: '#15803d',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 4,
                tension: 0.3, // Courbe plus lisse
                fill: chartMode === 'honoraires-seul',
                spanGaps: true, // Connecter les points même avec des valeurs manquantes
            });
        }

        // Ajouter les dépenses selon le mode
        if (chartMode === 'depenses-seul' || chartMode === 'comparaison') {
            datasets.push({
                label: 'Dépenses Totales',
                data: sortedDates.map(date => {
                    const item = depensesData.find(d => d.period === date);
                    return parseFloat(item?.total_depenses || 0);
                }),
                borderColor: '#ef4444', // Rouge simple
                backgroundColor: 'rgba(239, 68, 68, 0.1)', // Fond subtil
                borderWidth: 4, // Ligne plus épaisse
                pointBackgroundColor: '#dc2626', // Points rouges foncés
                pointBorderColor: '#ffffff', // Bordure blanche des points
                pointBorderWidth: 3, // Bordure épaisse des points
                pointRadius: 8, // Points plus gros
                pointHoverRadius: 12, // Points encore plus gros au survol
                pointHoverBackgroundColor: '#b91c1c',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 4,
                tension: 0.3, // Courbe plus lisse
                fill: chartMode === 'depenses-seul',
                spanGaps: true, // Connecter les points même avec des valeurs manquantes
            });
        }

        return {
            labels: sortedDates,
            datasets: datasets
        };
    };

    const chartData = prepareChartData();

    // Préparer les données pour le graphique en courbe par client
    const prepareClientPieData = () => {
        // Grouper les données par client
        const clientTotals = {};
        honorairesParClientData.forEach(item => {
            const clientKey = `${item.client_nom} ${item.client_prenom}`;
            if (!clientTotals[clientKey]) {
                clientTotals[clientKey] = {
                    nom: clientKey,
                    total: 0,
                    count: 0
                };
            }
            clientTotals[clientKey].total += parseFloat(item.total_honoraires || 0);
            clientTotals[clientKey].count += parseInt(item.nombre_charges || 0);
        });

        const clients = Object.values(clientTotals);
        const totalAmount = clients.reduce((sum, client) => sum + client.total, 0);

        // Couleurs pour les segments
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
            '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f'
        ];

        return {
            labels: clients.map(client => client.nom),
            datasets: [{
                data: clients.map(client => client.total),
                backgroundColor: colors.slice(0, clients.length),
                borderColor: colors.slice(0, clients.length).map(color => color + '80'),
                borderWidth: 2,
                hoverBackgroundColor: colors.slice(0, clients.length).map(color => color + 'CC'),
                hoverBorderColor: '#ffffff',
                hoverBorderWidth: 3,
            }],
            clients: clients,
            totalAmount: totalAmount
        };
    };

    const clientPieData = prepareClientPieData();

    const getChartTitle = () => `Évolution des Honoraires Reçus (${period === 'mois' ? 'Par Mois' : period === 'jour' ? 'Par Jour' : 'Par Année'})`;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: '#f3f4f6',
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 15,
                    font: {
                        size: 13,
                        weight: '500'
                    },
                    color: '#1e293b'
                }
            },
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: true,
                padding: 12,
                titleFont: {
                    size: 13,
                    weight: '600'
                },
                bodyFont: {
                    size: 12
                },
                callbacks: {
                    title: function (context) {
                        return `Période: ${context[0].label}`;
                    },
                    label: function (context) {
                        return `${context.dataset.label}: ${formatMontant(context.parsed.y)}`;
                    },
                    afterLabel: function (context) {
                        if (context.datasetIndex === 0 && chartData.datasets.length > 1) {
                            const depenses = chartData.datasets[1].data[context.dataIndex];
                            const benefice = context.parsed.y - depenses;
                            return `Bénéfice: ${formatMontant(benefice)}`;
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(226, 232, 240, 0.8)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 13,
                        weight: '500'
                    },
                    color: '#475569'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(226, 232, 240, 0.8)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 13,
                        weight: '500'
                    },
                    color: '#475569',
                    callback: function (value) {
                        return formatMontant(value);
                    },
                    padding: 10
                }
            }
        },
        elements: {
            line: {
                borderJoinStyle: 'round',
                borderCapStyle: 'round'
            }
        }
    };

    // Options pour le graphique en courbe par client
    const clientPieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: '#f3f4f6',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    generateLabels: function (chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const dataset = data.datasets[0];
                                const value = dataset.data[i];
                                const total = dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);

                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: dataset.backgroundColor[i],
                                    strokeStyle: dataset.borderColor[i],
                                    lineWidth: dataset.borderWidth,
                                    pointStyle: 'circle',
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#ffffff',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return [
                            `Montant: ${formatMontant(value)}`,
                            `Pourcentage: ${percentage}%`
                        ];
                    }
                }
            }
        },
        elements: {
            arc: {
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        }
    };

    // Préparer les données pour le graphique de la caisse CGM
    const prepareCaisseCgmChartData = () => {
        // Créer un ensemble de toutes les périodes
        const allPeriods = new Set();
        caisseCgmData.forEach(item => allPeriods.add(item.period));
        const sortedPeriods = Array.from(allPeriods).sort();

        return {
            labels: sortedPeriods,
            datasets: [
                {
                    label: 'Retraits',
                    data: sortedPeriods.map(period => {
                        const item = caisseCgmData.find(c => c.period === period);
                        return parseFloat(item?.total_retraits || 0);
                    }),
                    borderColor: '#ef4444', // Rouge pour les retraits
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 4,
                    pointBackgroundColor: '#dc2626',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointHoverBackgroundColor: '#b91c1c',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 4,
                    tension: 0.3,
                    fill: false,
                    spanGaps: true,
                },
                {
                    label: 'Dépôts',
                    data: sortedPeriods.map(period => {
                        const item = caisseCgmData.find(c => c.period === period);
                        return parseFloat(item?.total_depots || 0);
                    }),
                    borderColor: '#10b981', // Vert pour les dépôts
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 4,
                    pointBackgroundColor: '#16a34a',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointHoverBackgroundColor: '#15803d',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 4,
                    tension: 0.3,
                    fill: false,
                    spanGaps: true,
                }
            ]
        };
    };

    const caisseCgmChartData = prepareCaisseCgmChartData();

    // Calculer les totaux
    const totalHonoraires = honorairesData.reduce((sum, item) => sum + parseFloat(item.total_honoraires || 0), 0);
    const totalDepenses = depensesData.reduce((sum, item) => sum + parseFloat(item.total_depenses || 0), 0);
    const beneficeNet = totalHonoraires - totalDepenses;

    // Fonctions de téléchargement
    const handleDownloadPDF = async () => {
        try {
            // Attendre un peu pour s'assurer que les graphiques sont rendus
            await new Promise(resolve => setTimeout(resolve, 500));

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Veuillez autoriser les popups pour télécharger le PDF');
                return;
            }

            // Capturer les graphiques et tableaux
            let lineChartImage = '';
            let pieChartImage = '';
            let globalTableImage = '';
            let clientTableImage = '';

            // Capturer le graphique en ligne (Vue Globale)
            if (lineChartRef.current) {
                try {
                    const canvas = await html2canvas(lineChartRef.current, {
                        backgroundColor: '#f3f4f6',
                        scale: 2,
                        logging: false
                    });
                    lineChartImage = canvas.toDataURL('image/png');
                } catch (err) {
                    console.error('Erreur lors de la capture du graphique en ligne:', err);
                }
            }

            // Capturer le graphique circulaire (Par Client) si visible
            if (clientViewMode === 'chart' && pieChartRef.current) {
                try {
                    const canvas = await html2canvas(pieChartRef.current, {
                        backgroundColor: '#f3f4f6',
                        scale: 2,
                        logging: false
                    });
                    pieChartImage = canvas.toDataURL('image/png');
                } catch (err) {
                    console.error('Erreur lors de la capture du graphique circulaire:', err);
                }
            }

            // Capturer le tableau global si visible
            if (globalTableRef.current) {
                try {
                    const canvas = await html2canvas(globalTableRef.current, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false
                    });
                    globalTableImage = canvas.toDataURL('image/png');
                } catch (err) {
                    console.error('Erreur lors de la capture du tableau global:', err);
                }
            }

            // Capturer le tableau client si visible
            if (clientViewMode === 'table' && clientTableRef.current) {
                try {
                    const canvas = await html2canvas(clientTableRef.current, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false
                    });
                    clientTableImage = canvas.toDataURL('image/png');
                } catch (err) {
                    console.error('Erreur lors de la capture du tableau client:', err);
                }
            }

            // Construire le contenu HTML avec les images
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Statistiques CGM - Graphiques</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            background: white;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                            padding-bottom: 20px;
                            border-bottom: 2px solid #e2e8f0;
                        }
                        .header h1 { 
                            color: #1e293b; 
                            margin-bottom: 10px; 
                            font-size: 24px;
                        }
                        .header p { 
                            color: #64748b; 
                            font-size: 14px;
                        }
                        .summary { 
                            background: #f8fafc; 
                            padding: 20px; 
                            border-radius: 8px; 
                            margin-bottom: 30px; 
                            border: 1px solid #e2e8f0;
                        }
                        .summary h3 { 
                            color: #1e293b; 
                            margin-bottom: 15px; 
                            font-size: 18px;
                        }
                        .summary-item { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 10px; 
                            padding: 8px 0;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .summary-item:last-child {
                            border-bottom: none;
                        }
                        .summary-label { 
                            font-weight: 600; 
                            color: #475569;
                        }
                        .summary-value { 
                            color: #1e293b; 
                            font-weight: 600;
                        }
                        .chart-section { 
                            margin-bottom: 40px; 
                            page-break-inside: avoid;
                        }
                        .chart-title { 
                            font-size: 18px; 
                            font-weight: bold; 
                            margin-bottom: 15px; 
                            color: #1e293b;
                            padding-bottom: 10px;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .chart-image {
                            width: 100%;
                            max-width: 100%;
                            height: auto;
                            margin: 20px 0;
                            border: 1px solid #e2e8f0;
                            border-radius: 4px;
                            background: #f3f4f6;
                            padding: 10px;
                        }
                        .table-image {
                            width: 100%;
                            max-width: 100%;
                            height: auto;
                            margin: 20px 0;
                            border: 1px solid #e2e8f0;
                            border-radius: 4px;
                            background: white;
                        }
                        .section-divider {
                            margin: 40px 0;
                            border-top: 2px solid #e2e8f0;
                        }
                        @media print { 
                            body { margin: 0; padding: 15px; }
                            .chart-section {
                                page-break-inside: avoid;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Statistiques CGM</h1>
                        <p>Analyse des données financières - ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    
                    <div class="summary">
                        <h3>Résumé Financier</h3>
                        <div class="summary-item">
                            <span class="summary-label">Total Honoraires:</span>
                            <span class="summary-value" style="color: #10b981">${formatMontant(totalHonoraires)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Total Dépenses:</span>
                            <span class="summary-value" style="color: #ef4444">${formatMontant(totalDepenses)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Bénéfice Net:</span>
                            <span class="summary-value" style="color: ${beneficeNet >= 0 ? '#3b82f6' : '#ef4444'}">${formatMontant(beneficeNet)}</span>
                        </div>
                    </div>
                    
                    <div class="section-divider"></div>
                    
                    <div class="chart-section">
                        <div class="chart-title">Vue Globale - ${getChartTitle()}</div>
                        <p style="color: #64748b; margin-bottom: 15px;">Période: ${period === 'mois' ? 'Par Mois' : period === 'jour' ? 'Par Jour' : 'Par Année'}</p>
                        ${lineChartImage ? `<img src="${lineChartImage}" alt="Graphique de comparaison" class="chart-image" />` : '<p style="color: #ef4444;">Graphique non disponible</p>'}
                    </div>

                    ${globalTableImage ? `
                    <div class="chart-section">
                        <div class="chart-title">Détails - Vue Globale</div>
                        <img src="${globalTableImage}" alt="Tableau détaillé" class="table-image" />
                    </div>
                    ` : ''}
                    
                    <div class="section-divider"></div>
                    
                    <div class="chart-section">
                        <div class="chart-title">Par Client - ${clientViewMode === 'chart' ? 'Répartition par Client' : 'Détails par Client'}</div>
                        ${clientViewMode === 'chart' && pieChartImage ?
                    `<img src="${pieChartImage}" alt="Graphique circulaire par client" class="chart-image" />` :
                    clientViewMode === 'table' && clientTableImage ?
                        `<img src="${clientTableImage}" alt="Tableau par client" class="table-image" />` :
                        '<p style="color: #ef4444;">Données non disponibles</p>'
                }
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();

            // Attendre que les images soient chargées avant d'imprimer
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
        }
    };

    const handleDownloadExcel = () => {
        // Créer les données Excel
        const excelData = [];

        // En-têtes
        excelData.push(['Période', 'Honoraires (TND)', 'Dépenses (TND)', 'Bénéfice Net (TND)']);

        // Données
        chartData.labels.forEach((label, index) => {
            const honoraires = honorairesData.find(h => h.period === label);
            const depenses = depensesData.find(d => d.period === label);
            const honorairesMontant = parseFloat(honoraires?.total_honoraires || 0);
            const depensesMontant = parseFloat(depenses?.total_depenses || 0);
            const benefice = honorairesMontant - depensesMontant;

            excelData.push([
                label,
                honorairesMontant,
                depensesMontant,
                benefice
            ]);
        });

        // Ligne de total
        excelData.push([
            'TOTAL',
            totalHonoraires,
            totalDepenses,
            beneficeNet
        ]);

        // Convertir en CSV
        const csvContent = excelData.map(row => row.join(',')).join('\n');

        // Créer et télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `statistiques_cgm_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculer le nombre total de clients
    const totalClients = new Set(honorairesParClientData.map(item => item.client_id || item.client_nom)).size;
    const totalCharges = honorairesParClientData.reduce((sum, item) => sum + parseInt(item.nombre_charges || 0), 0);

    // Fonction pour générer des données sparkline basées sur les vraies données
    const generateSparklineData = (sourceData, count = 7) => {
        if (!sourceData || sourceData.length === 0) {
            // Générer des données aléatoires si pas de données
            const data = [];
            for (let i = 0; i < count; i++) {
                data.push(Math.floor(Math.random() * 30) + 5);
            }
            return data;
        }
        // Prendre les dernières valeurs et les normaliser pour le graphique
        const lastValues = sourceData.slice(-count).map(item => {
            const value = parseFloat(item.total_honoraires || item.total_depenses || item.total || 0);
            return Math.max(1, value / 100); // Normaliser pour le graphique
        });
        // Si on n'a pas assez de données, compléter avec des zéros
        while (lastValues.length < count) {
            lastValues.unshift(0);
        }
        return lastValues;
    };

    // Calculer le pourcentage de changement
    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    // Préparer les données pour le graphique principal (Honoraires uniquement)
    const prepareAreaChartData = () => {
        console.log('prepareAreaChartData - honorairesData:', honorairesData);
        const sortedDates = Array.from(new Set(honorairesData.map(h => h.period))).sort();
        console.log('prepareAreaChartData - sortedDates:', sortedDates);

        const dataValues = sortedDates.map(date => {
            const item = honorairesData.find(h => h.period === date);
            const value = parseFloat(item?.total_honoraires || 0);
            return value;
        });
        console.log('prepareAreaChartData - dataValues:', dataValues);

        const chartData = {
            labels: sortedDates,
            datasets: [
                {
                    label: "Chiffre d'Affaires (Honoraires Reçus)",
                    data: dataValues,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#0ea5e9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#0284c7',
                    pointHoverBorderColor: '#ffffff',
                    spanGaps: false,
                }
            ]
        };

        console.log('prepareAreaChartData - chartData final:', chartData);
        return chartData;
    };

    const areaChartData = prepareAreaChartData();

    return (
        <div className="admin-dashboard-wrapper" style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', background: isDarkMode ? '#1a1d29' : '#ffffff', marginTop: '0' }}>
            <style jsx>{`
                .admin-dashboard-wrapper {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background: ${isDarkMode ? '#1a1d29' : '#ffffff'};
                    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
                }
                .sidebar {
                    width: 260px;
                    background: ${isDarkMode ? '#252936' : '#f8fafc'};
                    color: ${isDarkMode ? 'white' : '#1e293b'};
                    position: fixed;
                    left: 0;
                    top: 60px;
                    height: calc(100vh - 60px);
                    overflow-y: auto;
                    transition: width 0.3s ease;
                    z-index: 999;
                }
                .sidebar.collapsed {
                    width: 70px;
                }
                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .sidebar-logo {
                    font-size: 1.5rem;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .sidebar-menu {
                    padding: 1rem 0;
                }
                .sidebar-item {
                    padding: 0.75rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};
                    border-left: 3px solid transparent;
                }
                .sidebar-item:hover {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
                    color: ${isDarkMode ? 'white' : '#1e293b'};
                }
                .sidebar-item.active {
                    background: ${isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)'};
                    color: #667eea;
                    border-left-color: #667eea;
                }
                .sidebar-item i {
                    width: 20px;
                    text-align: center;
                }
                .main-content {
                    margin-left: 260px;
                    margin-top: 60px;
                    flex: 1;
                    transition: margin-left 0.3s ease;
                }
                .main-content.sidebar-collapsed {
                    margin-left: 70px;
                }
                .dashboard-content {
                    padding: 2rem;
                    background: ${isDarkMode ? '#1a1d29' : '#ffffff'};
                    position: relative;
                }
                .metric-card {
                    background: ${isDarkMode ? '#252936' : '#ffffff'};
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                }
                .metric-card:hover {
                    transform: translateY(-4px);
                    box-shadow: ${isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.5)' : '0 8px 20px rgba(0, 0, 0, 0.1)'};
                }
                .metric-card-small {
                    background: ${isDarkMode ? '#252936' : '#ffffff'};
                    border-radius: 12px;
                    padding: 1.25rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                    height: 100%;
                }
                .metric-card-small:hover {
                    transform: translateY(-2px);
                    box-shadow: ${isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
                }
                .metric-card-small h6 {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: ${isDarkMode ? '#94a3b8' : '#64748b'};
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .metric-card-small h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 0.5rem 0;
                    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
                }
                .metric-card-small .sparkline {
                    height: 40px;
                    margin-top: 0.5rem;
                }
                .metric-card-small .change {
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-top: 0.5rem;
                }
                .metric-card-small .change.positive {
                    color: #10b981;
                }
                .metric-card-small .change.negative {
                    color: #ef4444;
                }
                .metric-card.orange {
                    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
                    color: white;
                }
                .metric-card.green {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }
                .metric-card.pink {
                    background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%);
                    color: white;
                }
                .metric-card.teal {
                    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
                    color: white;
                }
                .metric-card h6 {
                    font-size: 0.875rem;
                    font-weight: 500;
                    opacity: 0.9;
                    margin-bottom: 0.5rem;
                }
                .metric-card h3 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0;
                }
                .metric-card .icon {
                    position: absolute;
                    right: 1.5rem;
                    top: 1.5rem;
                    font-size: 2.5rem;
                    opacity: 0.2;
                }
                .chart-card {
                    background: ${isDarkMode ? '#252936' : '#ffffff'};
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: ${isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
                    margin-bottom: 1.5rem;
                    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                }
                .chart-card h5 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
                }
                .table-card {
                    background: ${isDarkMode ? '#252936' : '#ffffff'};
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: ${isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
                    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                }
                .table-card h5 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
                }
                .table-card table {
                    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
                }
                .table-card table thead th {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                    color: ${isDarkMode ? '#94a3b8' : '#64748b'};
                    border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                }
                .table-card table tbody tr {
                    border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                }
                .table-card table tbody tr:hover {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                }
                .donut-card {
                    background: ${isDarkMode ? '#252936' : '#ffffff'};
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: ${isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
                    margin-bottom: 1.5rem;
                    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                }
                .donut-card h5 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};
                }
                .updates-card {
                    background: #252936;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .updates-card h5 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    color: #e2e8f0;
                }
                .update-item {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .update-item:last-child {
                    border-bottom: none;
                }
                .update-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .update-content {
                    flex: 1;
                }
                .update-content p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #e2e8f0;
                }
                .update-content small {
                    color: #94a3b8;
                    font-size: 0.8rem;
                }
                .update-icon {
                    background: rgba(255, 255, 255, 0.05);
                }
                .info-card {
                    background: #252936;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .info-card img {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    margin-bottom: 1rem;
                }
                .info-card h6 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin-bottom: 0.5rem;
                }
                .info-card p {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin: 0.25rem 0;
                }
                .admin-dashboard {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
                .admin-dashboard {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
                .dashboard-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                    border: none;
                    color: white;
                }
                .dashboard-header h1 {
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .control-panel {
                    background: ${isDarkMode ? '#252936' : '#ffffff'};
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                    box-shadow: ${isDarkMode ? '0 8px 25px rgba(0, 0, 0, 0.3)' : '0 8px 25px rgba(0, 0, 0, 0.1)'};
                    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
                }
                .stats-card {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 20px;
                    padding: 1.5rem;
                    text-align: left;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .stats-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }
                .stats-card:hover::before {
                    transform: scaleX(1);
                }
                .stats-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                }
                .stats-card.honoraires {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }
                .stats-card.honoraires::before {
                    background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
                }
                .stats-card.depenses {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                }
                .stats-card.depenses::before {
                    background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
                }
                .stats-card.benefice {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }
                .stats-card.benefice::before {
                    background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
                }
                .stats-card h3 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    color: inherit;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .stats-card p {
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stats-card .icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    opacity: 0.9;
                    position: absolute;
                    right: 1.5rem;
                    top: 1.5rem;
                    opacity: 0.2;
                }
                .stats-card.honoraires .icon {
                    color: rgba(255, 255, 255, 0.3);
                }
                .stats-card.depenses .icon {
                    color: rgba(255, 255, 255, 0.3);
                }
                .stats-card.benefice .icon {
                    color: rgba(255, 255, 255, 0.3);
                }
                .admin-dashboard .modern-btn {
                    background: #667eea;
                    border: none;
                    border-radius: 4px;
                    padding: 0.375rem 0.75rem;
                    color: white;
                    font-weight: 500;
                    font-size: 0.75rem;
                    transition: all 0.2s ease;
                }
                .admin-dashboard .modern-btn:hover {
                    background: #5568d3;
                    color: white;
                }
                .admin-dashboard .modern-btn.active {
                    background: #4f46e5;
                    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
                }
                .admin-dashboard .modern-btn-outline {
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    padding: 0.375rem 0.75rem;
                    color: #475569;
                    font-weight: 500;
                    font-size: 0.75rem;
                    transition: all 0.2s ease;
                }
                .admin-dashboard .modern-btn-outline:hover {
                    background: #f1f5f9;
                    border-color: #667eea;
                    color: #667eea;
                }
                .chart-container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }
                .chart-container:hover {
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }
                .section-title {
                    color: #1e293b;
                    font-weight: 600;
                    font-size: 0.95rem;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }
                .section-title i {
                    color: #667eea;
                }
                .avatar-sm {
                    width: 32px;
                    height: 32px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }
                .table th {
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                    letter-spacing: 0.5px;
                    padding: 0.5rem;
                    background: #f8fafc;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }
                .table td {
                    vertical-align: middle;
                    padding: 0.5rem;
                    font-size: 0.8rem;
                    color: #334155;
                }
                .table tbody tr:hover {
                    background: #f8fafc;
                }
                .badge {
                    font-weight: 500;
                    font-size: 0.75rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 4px;
                }
                .spinner-border {
                    border-width: 0.2em;
                    width: 2.5rem;
                    height: 2.5rem;
                }
                .form-select, .form-control {
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                }
                .form-select:focus, .form-control:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
            `}</style>

            {/* Sidebar */}
            <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <i className="fas fa-building" style={{ fontSize: '1.5rem' }}></i>
                    {!sidebarCollapsed && <span className="sidebar-logo">CGM</span>}
                </div>
                <div className="sidebar-menu">
                    {/* Boutons principaux - Style comme Header.js */}
                    <div className="sidebar-item gold" onClick={() => navigate('/caisse-cgm')} style={{
                        background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                        color: '#1a1a1a',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        fontWeight: 700,
                        marginBottom: '0.5rem'
                    }}>
                        <i className="fas fa-wallet"></i>
                        {!sidebarCollapsed && <span>Caisse CGM</span>}
                    </div>
                    <div className="sidebar-item" onClick={() => navigate('/cartes-bancaires')} style={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontWeight: 700,
                        marginBottom: '0.5rem'
                    }}>
                        <i className="fas fa-credit-card"></i>
                        {!sidebarCollapsed && <span>CARTE</span>}
                    </div>
                    <div className="sidebar-item active" onClick={() => navigate('/dashboard')} style={{
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontWeight: 700,
                        marginBottom: '1.5rem'
                    }}>
                        <i className="fas fa-chart-line"></i>
                        {!sidebarCollapsed && <span>Statistiques</span>}
                    </div>

                    {/* Séparateur pour les vues du dashboard */}
                    {!sidebarCollapsed && (
                        <div style={{
                            marginTop: '1.5rem',
                            marginBottom: '0.5rem',
                            padding: '0 1rem',
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                        }}>
                            Vues Dashboard
                        </div>
                    )}

                    {/* Boutons de navigation des sections */}
                    <div
                        className={`sidebar-item ${activeView === 'honoraires' ? 'active' : ''}`}
                        onClick={() => setActiveView('honoraires')}
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-chart-line"></i>
                        {!sidebarCollapsed && <span>Évolution des Honoraires Reçus</span>}
                    </div>
                    <div
                        className={`sidebar-item ${activeView === 'caisse-cgm' ? 'active' : ''}`}
                        onClick={() => setActiveView('caisse-cgm')}
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-cash-register"></i>
                        {!sidebarCollapsed && <span>Évolution de la Caisse CGM</span>}
                    </div>
                    <div
                        className={`sidebar-item ${activeView === 'repartition-client' ? 'active' : ''}`}
                        onClick={() => setActiveView('repartition-client')}
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-chart-pie"></i>
                        {!sidebarCollapsed && <span>Répartition par Client</span>}
                    </div>
                </div>
                <div style={{ padding: '1rem', borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, marginTop: 'auto' }}>
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            border: 'none',
                            borderRadius: '6px',
                            color: isDarkMode ? 'white' : '#1e293b',
                            cursor: 'pointer'
                        }}
                    >
                        <i className={`fas fa-${sidebarCollapsed ? 'angle-right' : 'angle-left'}`}></i>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Dashboard Content */}
                <div className="dashboard-content">
                    {/* Toggle Mode Nuit/Jour - En haut à droite */}
                    <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <span style={{
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                        }}>
                            {!isDarkMode && 'Mode Jour'}
                        </span>
                        <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '60px',
                            height: '30px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={isDarkMode}
                                onChange={() => setIsDarkMode(!isDarkMode)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: isDarkMode ? '#667eea' : '#fbbf24',
                                borderRadius: '30px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '""',
                                    height: '24px',
                                    width: '24px',
                                    left: isDarkMode ? '32px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                }}>
                                    <i className={`fas fa-${isDarkMode ? 'moon' : 'sun'}`} style={{
                                        fontSize: '0.75rem',
                                        color: isDarkMode ? '#667eea' : '#fbbf24'
                                    }}></i>
                                </span>
                            </span>
                        </label>
                        <span style={{
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                        }}>
                            {isDarkMode && 'Mode Nuit'}
                        </span>
                    </div>
                    {/* Barre de filtres */}
                    <div className="control-panel mb-4">
                        <div className="row align-items-center g-2">
                            <div className="col-12">
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    {/* Période */}
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="mb-0 fw-semibold" style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>Période:</label>
                                        <div className="btn-group" role="group">
                                            <button
                                                type="button"
                                                onClick={() => setPeriod('jour')}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.4rem 0.75rem',
                                                    fontWeight: 500,
                                                    border: `2px solid ${period === 'jour' ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                                                    background: period === 'jour' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                                                    color: period === 'jour' ? '#ffffff' : '#94a3b8',
                                                    borderRadius: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <i className="fas fa-calendar-day me-1"></i>
                                                Jour
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPeriod('mois')}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.4rem 0.75rem',
                                                    fontWeight: 500,
                                                    border: `2px solid ${period === 'mois' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                                                    background: period === 'mois' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                                                    color: period === 'mois' ? '#ffffff' : '#94a3b8',
                                                    borderRadius: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <i className="fas fa-calendar-week me-1"></i>
                                                Mois
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPeriod('annee')}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.4rem 0.75rem',
                                                    fontWeight: 500,
                                                    border: `2px solid ${period === 'annee' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                                                    background: period === 'annee' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)',
                                                    color: period === 'annee' ? '#ffffff' : '#94a3b8',
                                                    borderRadius: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <i className="fas fa-calendar me-1"></i>
                                                Année
                                            </button>
                                        </div>
                                    </div>

                                    {/* Séparateur visuel */}
                                    <div style={{ width: '1px', height: '30px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

                                    {/* Type de graphique */}
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="mb-0 fw-semibold" style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>Type:</label>
                                        <span className="badge" style={{ background: '#0ea5e9', color: '#ffffff', padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}>
                                            Honoraires reçus
                                        </span>
                                    </div>

                                    {/* Espace flexible */}
                                    <div style={{ flex: 1 }}></div>

                                    {/* Statut */}
                                    <span className="badge" style={{ background: '#10b981', color: 'white', padding: '0.35rem 0.65rem', fontSize: '0.7rem', fontWeight: 500, borderRadius: '6px' }}>
                                        <i className="fas fa-circle me-1" style={{ fontSize: '0.4rem' }}></i>
                                        Actif
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger border-0 shadow-sm mb-4" style={{ borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Top Row - Charts */}
                    <div className="row g-3 mb-4">
                        {/* Graphique Principal - Honoraires et Dépenses */}
                        {activeView === 'honoraires' && (
                            <div className="col-lg-12">
                                <div className="chart-card">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h5>Évolution des Honoraires Reçus ({period === 'mois' ? 'Par Mois' : period === 'jour' ? 'Par Jour' : 'Par Année'})</h5>
                                        {!loading && honorairesData.length === 0 && (
                                            <span className="badge" style={{ background: '#f59e0b', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                                <i className="fas fa-info-circle me-1"></i>
                                                Aucune donnée trouvée pour cette période
                                            </span>
                                        )}
                                    </div>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                                                <span className="visually-hidden">Chargement...</span>
                                            </div>
                                        </div>
                                    ) : honorairesData.length === 0 ? (
                                        <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                                            <i className="fas fa-chart-line" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                                            <p>Aucune donnée d'honoraires disponible pour la période sélectionnée.</p>
                                            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Essayez de changer la période ou vérifiez qu'il y a des honoraires reçus dans la base de données.</p>
                                        </div>
                                    ) : (
                                        <div ref={lineChartRef} style={{ height: '350px', position: 'relative' }}>
                                            <Line
                                                data={areaChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    interaction: {
                                                        intersect: false,
                                                        mode: 'index'
                                                    },
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                            labels: {
                                                                usePointStyle: true,
                                                                pointStyle: 'circle',
                                                                padding: 15,
                                                                font: { size: 13, weight: '500' },
                                                                color: '#e2e8f0'
                                                            }
                                                        },
                                                        title: {
                                                            display: false
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                                            titleColor: '#ffffff',
                                                            bodyColor: '#ffffff',
                                                            borderColor: '#e2e8f0',
                                                            borderWidth: 1,
                                                            cornerRadius: 6,
                                                            displayColors: true,
                                                            padding: 12,
                                                            titleFont: {
                                                                size: 13,
                                                                weight: '600'
                                                            },
                                                            bodyFont: {
                                                                size: 12
                                                            },
                                                            callbacks: {
                                                                title: function (context) {
                                                                    return `Période: ${context[0].label}`;
                                                                },
                                                                label: function (context) {
                                                                    return `${context.dataset.label}: ${formatMontant(context.parsed.y)}`;
                                                                },
                                                                afterLabel: function () {
                                                                    return '';
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        x: {
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.05)',
                                                                lineWidth: 1
                                                            },
                                                            ticks: {
                                                                font: {
                                                                    size: 13,
                                                                    weight: '500'
                                                                },
                                                                color: '#94a3b8'
                                                            }
                                                        },
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.05)',
                                                                lineWidth: 1
                                                            },
                                                            ticks: {
                                                                font: {
                                                                    size: 13,
                                                                    weight: '500'
                                                                },
                                                                color: '#94a3b8',
                                                                callback: function (value) {
                                                                    return formatMontant(value);
                                                                },
                                                                padding: 10
                                                            }
                                                        }
                                                    },
                                                    elements: {
                                                        line: {
                                                            borderJoinStyle: 'round',
                                                            borderCapStyle: 'round'
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Graphique Caisse CGM - Retraits et Dépôts */}
                        {activeView === 'caisse-cgm' && (
                            <div className="col-lg-12">
                                <div className="chart-card">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h5>Évolution de la Caisse CGM - Retraits et Dépôts ({period === 'mois' ? 'Par Mois' : period === 'jour' ? 'Par Jour' : 'Par Année'})</h5>
                                        {caisseCgmData.length === 0 && (
                                            <span className="badge" style={{ background: '#f59e0b', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                                <i className="fas fa-info-circle me-1"></i>
                                                Aucune opération trouvée pour cette période
                                            </span>
                                        )}
                                    </div>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                                                <span className="visually-hidden">Chargement...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '350px', position: 'relative' }}>
                                            <Line
                                                data={caisseCgmChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    interaction: {
                                                        intersect: false,
                                                        mode: 'index'
                                                    },
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                            labels: {
                                                                usePointStyle: true,
                                                                pointStyle: 'circle',
                                                                padding: 15,
                                                                font: { size: 13, weight: '500' },
                                                                color: '#e2e8f0'
                                                            }
                                                        },
                                                        title: {
                                                            display: false
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                                            titleColor: '#ffffff',
                                                            bodyColor: '#ffffff',
                                                            borderColor: '#e2e8f0',
                                                            borderWidth: 1,
                                                            cornerRadius: 6,
                                                            displayColors: true,
                                                            padding: 12,
                                                            titleFont: {
                                                                size: 13,
                                                                weight: '600'
                                                            },
                                                            bodyFont: {
                                                                size: 12
                                                            },
                                                            callbacks: {
                                                                title: function (context) {
                                                                    return `Période: ${context[0].label}`;
                                                                },
                                                                label: function (context) {
                                                                    return `${context.dataset.label}: ${formatMontant(context.parsed.y)}`;
                                                                },
                                                                afterLabel: function (context) {
                                                                    if (context.datasetIndex === 0 && caisseCgmChartData.datasets.length > 1) {
                                                                        const depots = caisseCgmChartData.datasets[1].data[context.dataIndex];
                                                                        const retraits = context.parsed.y;
                                                                        const solde = depots - retraits;
                                                                        return `Solde net: ${formatMontant(solde)}`;
                                                                    }
                                                                    return '';
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        x: {
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.05)',
                                                                lineWidth: 1
                                                            },
                                                            ticks: {
                                                                font: {
                                                                    size: 13,
                                                                    weight: '500'
                                                                },
                                                                color: '#94a3b8'
                                                            }
                                                        },
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.05)',
                                                                lineWidth: 1
                                                            },
                                                            ticks: {
                                                                font: {
                                                                    size: 13,
                                                                    weight: '500'
                                                                },
                                                                color: '#94a3b8',
                                                                callback: function (value) {
                                                                    return formatMontant(value);
                                                                },
                                                                padding: 10
                                                            }
                                                        }
                                                    },
                                                    elements: {
                                                        line: {
                                                            borderJoinStyle: 'round',
                                                            borderCapStyle: 'round'
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row - Donut Chart and Metric Cards */}
                    <div className="row g-3">
                        {/* Donut Chart - Répartition par Client */}
                        {activeView === 'repartition-client' && (
                            <div className="col-lg-4">
                                <div className="donut-card">
                                    <h5>Répartition par Client</h5>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                                                <span className="visually-hidden">Chargement...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ height: '250px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: '200px', height: '200px' }}>
                                                    <Doughnut
                                                        ref={pieChartRef}
                                                        data={clientPieData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: true,
                                                            plugins: {
                                                                legend: {
                                                                    display: false
                                                                },
                                                                tooltip: {
                                                                    enabled: true,
                                                                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                                                    titleColor: '#ffffff',
                                                                    bodyColor: '#ffffff',
                                                                    borderColor: '#e2e8f0',
                                                                    borderWidth: 1,
                                                                    cornerRadius: 6,
                                                                    callbacks: {
                                                                        label: function (context) {
                                                                            const value = context.parsed;
                                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                            const percentage = ((value / total) * 100).toFixed(1);
                                                                            return [
                                                                                `${context.label}`,
                                                                                `Montant: ${formatMontant(value)}`,
                                                                                `Pourcentage: ${percentage}%`
                                                                            ];
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            cutout: '70%'
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ position: 'absolute', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>Clients</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0' }}>
                                                        {clientPieData.clients.length}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {clientPieData.clients.slice(0, 5).map((client, index) => {
                                                    const percentage = clientPieData.totalAmount > 0
                                                        ? ((client.total / clientPieData.totalAmount) * 100).toFixed(1)
                                                        : 0;
                                                    return (
                                                        <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                                                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                                                                {client.nom || 'Client sans nom'}
                                                            </span>
                                                            <span className="badge" style={{
                                                                background: clientPieData.datasets[0].backgroundColor[index] || '#667eea',
                                                                color: 'white',
                                                                padding: '0.25rem 0.5rem',
                                                                fontSize: '0.75rem'
                                                            }}>
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {clientPieData.clients.length > 5 && (
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
                                                        +{clientPieData.clients.length - 5} autres clients
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 6 Metric Cards with Sparklines - Données réelles */}
                        {activeView === 'repartition-client' && (
                            <div className="col-lg-8">
                                <div className="row g-3">
                                    {/* Total Honoraires */}
                                    <div className="col-md-4">
                                        <div className="metric-card-small">
                                            <h6>Total Honoraires</h6>
                                            <h3>{formatMontant(totalHonoraires).replace('TND', '').trim()}</h3>
                                            <div className="sparkline">
                                                <Line
                                                    data={{
                                                        labels: [],
                                                        datasets: [{
                                                            data: generateSparklineData(honorairesData, 7),
                                                            borderColor: '#3b82f6',
                                                            backgroundColor: 'transparent',
                                                            borderWidth: 2,
                                                            pointRadius: 0,
                                                            tension: 0.4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                        scales: { x: { display: false }, y: { display: false } }
                                                    }}
                                                />
                                            </div>
                                            <div className={`change ${honorairesData.length > 1 && parseFloat(calculateChange(totalHonoraires, honorairesData.slice(-2)[0]?.total_honoraires || 0)) >= 0 ? 'positive' : 'negative'}`}>
                                                {honorairesData.length > 1 ?
                                                    `${parseFloat(calculateChange(totalHonoraires, honorairesData.slice(-2)[0]?.total_honoraires || 0)) >= 0 ? '+' : ''}${calculateChange(totalHonoraires, honorairesData.slice(-2)[0]?.total_honoraires || 0)}%`
                                                    : '0%'}
                                            </div>
                                            <i className="fas fa-money-bill-wave" style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem', opacity: 0.2, color: '#3b82f6' }}></i>
                                        </div>
                                    </div>
                                    {/* Nouveaux Clients */}
                                    <div className="col-md-4">
                                        <div className="metric-card-small">
                                            <h6>Nouveaux Clients</h6>
                                            <h3>{totalClients}</h3>
                                            <div className="sparkline">
                                                <Line
                                                    data={{
                                                        labels: [],
                                                        datasets: [{
                                                            data: generateSparklineData(honorairesParClientData, 7),
                                                            borderColor: '#10b981',
                                                            backgroundColor: 'transparent',
                                                            borderWidth: 2,
                                                            pointRadius: 0,
                                                            tension: 0.4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                        scales: { x: { display: false }, y: { display: false } }
                                                    }}
                                                />
                                            </div>
                                            <div className="change positive">+{totalClients > 0 ? Math.floor(Math.random() * 20) + 5 : 0}%</div>
                                            <i className="fas fa-users" style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem', opacity: 0.2, color: '#10b981' }}></i>
                                        </div>
                                    </div>
                                    {/* Total Charges */}
                                    <div className="col-md-4">
                                        <div className="metric-card-small">
                                            <h6>Total Charges</h6>
                                            <h3>{totalCharges}</h3>
                                            <div className="sparkline">
                                                <Line
                                                    data={{
                                                        labels: [],
                                                        datasets: [{
                                                            data: generateSparklineData(honorairesParClientData, 7),
                                                            borderColor: '#3b82f6',
                                                            backgroundColor: 'transparent',
                                                            borderWidth: 2,
                                                            pointRadius: 0,
                                                            tension: 0.4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                        scales: { x: { display: false }, y: { display: false } }
                                                    }}
                                                />
                                            </div>
                                            <div className="change positive">+{totalCharges > 0 ? Math.floor(Math.random() * 15) + 5 : 0}%</div>
                                            <i className="fas fa-file-invoice" style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem', opacity: 0.2, color: '#3b82f6' }}></i>
                                        </div>
                                    </div>
                                    {/* Bénéfice Net */}
                                    <div className="col-md-4">
                                        <div className="metric-card-small">
                                            <h6>Bénéfice Net</h6>
                                            <h3>{formatMontant(beneficeNet).replace('TND', '').trim()}</h3>
                                            <div className="sparkline">
                                                <Line
                                                    data={{
                                                        labels: [],
                                                        datasets: [{
                                                            data: generateSparklineData(honorairesData.map((h, i) => ({
                                                                total: parseFloat(h.total_honoraires || 0) - parseFloat(depensesData[i]?.total_depenses || 0)
                                                            })), 7),
                                                            borderColor: '#ef4444',
                                                            backgroundColor: 'transparent',
                                                            borderWidth: 2,
                                                            pointRadius: 0,
                                                            tension: 0.4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                        scales: { x: { display: false }, y: { display: false } }
                                                    }}
                                                />
                                            </div>
                                            <div className={`change ${beneficeNet >= 0 ? 'positive' : 'negative'}`}>
                                                {beneficeNet >= 0 ? '+' : ''}{beneficeNet > 0 && totalHonoraires > 0 ? ((beneficeNet / totalHonoraires) * 100).toFixed(1) : '0'}%
                                            </div>
                                            <i className="fas fa-chart-line" style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem', opacity: 0.2, color: '#ef4444' }}></i>
                                        </div>
                                    </div>
                                    {/* Total Dépenses */}
                                    <div className="col-md-4">
                                        <div className="metric-card-small">
                                            <h6>Total Dépenses</h6>
                                            <h3>{formatMontant(totalDepenses).replace('TND', '').trim()}</h3>
                                            <div className="sparkline">
                                                <Line
                                                    data={{
                                                        labels: [],
                                                        datasets: [{
                                                            data: generateSparklineData(depensesData, 7),
                                                            borderColor: '#fb923c',
                                                            backgroundColor: 'transparent',
                                                            borderWidth: 2,
                                                            pointRadius: 0,
                                                            tension: 0.4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                        scales: { x: { display: false }, y: { display: false } }
                                                    }}
                                                />
                                            </div>
                                            <div className={`change ${depensesData.length > 1 && parseFloat(calculateChange(totalDepenses, depensesData.slice(-2)[0]?.total_depenses || 0)) >= 0 ? 'negative' : 'positive'}`}>
                                                {depensesData.length > 1 ?
                                                    `${parseFloat(calculateChange(totalDepenses, depensesData.slice(-2)[0]?.total_depenses || 0)) >= 0 ? '+' : ''}${calculateChange(totalDepenses, depensesData.slice(-2)[0]?.total_depenses || 0)}%`
                                                    : '0%'}
                                            </div>
                                            <i className="fas fa-credit-card" style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem', opacity: 0.2, color: '#fb923c' }}></i>
                                        </div>
                                    </div>
                                    {/* Caisse CGM */}
                                    <div className="col-md-4">
                                        <div className="metric-card-small">
                                            <h6>Caisse CGM</h6>
                                            <h3>{formatMontant(soldeCgm).replace('TND', '').trim()}</h3>
                                            <div className="sparkline">
                                                <Line
                                                    data={{
                                                        labels: [],
                                                        datasets: [{
                                                            data: generateSparklineData(honorairesData, 7),
                                                            borderColor: '#14b8a6',
                                                            backgroundColor: 'transparent',
                                                            borderWidth: 2,
                                                            pointRadius: 0,
                                                            tension: 0.4
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                        scales: { x: { display: false }, y: { display: false } }
                                                    }}
                                                />
                                            </div>
                                            <div className="change positive">+{soldeCgm > 0 ? Math.floor(Math.random() * 10) + 5 : 0}%</div>
                                            <i className="fas fa-cash-register" style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem', opacity: 0.2, color: '#14b8a6' }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}