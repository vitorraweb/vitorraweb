// /assets/js/calculator.js
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const CURRENCY = "EUR";
  const SUPPORTED_LANGS = [
    "de", "en", "es", "fr", "it", "nl", "ru", "tr",
    "hr", "el", "pl", "sq", "cs"
  ];

  function detectLang() {
    const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase().trim();
    if (htmlLang) {
      const short = htmlLang.split("-")[0];
      if (SUPPORTED_LANGS.includes(short)) return short;
    }

    const parts = window.location.pathname.split("/").filter(Boolean);
    const maybe = (parts[0] || "de").toLowerCase();
    return SUPPORTED_LANGS.includes(maybe) ? maybe : "de";
  }

  const LANG = detectLang();

  const I18N = {
    de: {
      actions: {
        reset: "Zurücksetzen",
      },
      labels: {
        formTitle: "Deine Eckdaten",
        calcMode: "Modus",
        financeModel: "Finanzierungsmodell",
        vehicleType: "Fahrzeugtyp",
        fuelPrice: "Kraftstoffpreis",
        systemCost: "FET-Kosten (€)",
        savingPct: "Kraftstoffersparnis (%)",
        downPaymentPct: "Anzahlung (%)",
        rentalDuration: "Mietlaufzeit (max. 48 Monate)",
        financeRate: "Finanzierungszins p.a.",
        annualKm: "Jährliche Fahrleistung (km/Jahr)",
        annualH: "Jährliche Betriebsstunden (h/Jahr)",
        consKm: "Verbrauch (l/100 km)",
        consH: "Verbrauch (l/h)",
        annualPlaceholderKm: "z. B. 35'000",
        annualPlaceholderH: "z. B. 900",
        consPlaceholderKm: "z. B. 11.5",
        consPlaceholderH: "z. B. 45",
      },
      modeOptions: {
        km: "Kilometer (l/100 km)",
        h: "Betriebsstunden (l/h)",
      },
      financeOptions: {
        purchase: "Kauf",
        rental: "Miete",
      },
      results: {
        kicker: "Ergebnis",
        yearlySaving: "Jährliche Ersparnis",
        monthlyNetBenefit: "Monatlicher Nettovorteil",
        payback: "Amortisation",
        rentalBreakEven: "Zeit bis Kostendeckung",
        yearlyCosts: "Kosten/Jahr",
        monthlyRentalPayment: "Mietrate/Monat",
        time: "Zeit",
        withoutWith: "ohne / mit",
        perMonth: "pro Monat",
        rentalDetails: "Mietdetails",
        downPaymentEuro: "Anzahlung",
        amountToFinance: "Zu finanzierender Betrag",
        annualNetBenefit: "Jährlicher Nettovorteil",
        totalRentalCost: "Gesamtkosten Miete",
        extraCostVsPurchase: "Mehrkosten ggü. Kauf",
        totalBenefitOverPeriod: "Gesamtvorteil über Laufzeit",
        yearlyCostsWithoutWith: "Kosten/Jahr ohne / mit",
      },
      units: {
        months: "Monate",
        years: "Jahre",
        weeks: "Wochen",
        monthShort: "Monate",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "PKW bis 2.0l Hubraum", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Sprinter, LKW & SUV bis 7.5t", cost: 450 },
          { value: "LKW_18T", label: "LKW bis 18t", cost: 750 },
          { value: "LKW_40T", label: "LKW bis 40t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Kleine Baumaschinen 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Mittlere Baumaschinen 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Grosse Baumaschinen 18-35 l/h", cost: 1450 },
        ],
      },
    },

    en: {
      actions: { reset: "Reset" },
      labels: {
        formTitle: "Your inputs",
        calcMode: "Mode",
        financeModel: "Financing model",
        vehicleType: "Vehicle type",
        fuelPrice: "Fuel price",
        systemCost: "FET cost (€)",
        savingPct: "Fuel savings (%)",
        downPaymentPct: "Down payment (%)",
        rentalDuration: "Rental duration (max. 48 months)",
        financeRate: "Finance rate p.a.",
        annualKm: "Annual mileage (km/year)",
        annualH: "Annual operating hours (h/year)",
        consKm: "Consumption (l/100 km)",
        consH: "Consumption (l/h)",
        annualPlaceholderKm: "e.g. 35,000",
        annualPlaceholderH: "e.g. 900",
        consPlaceholderKm: "e.g. 11.5",
        consPlaceholderH: "e.g. 45",
      },
      modeOptions: {
        km: "Kilometers (l/100 km)",
        h: "Operating hours (l/h)",
      },
      financeOptions: {
        purchase: "Purchase",
        rental: "Rental",
      },
      results: {
        kicker: "Result",
        yearlySaving: "Annual savings",
        monthlyNetBenefit: "Monthly net benefit",
        payback: "Payback",
        rentalBreakEven: "Rental break-even",
        yearlyCosts: "Cost/year",
        monthlyRentalPayment: "Rental payment/month",
        time: "Time",
        withoutWith: "without / with",
        perMonth: "per month",
        rentalDetails: "Rental details",
        downPaymentEuro: "Down payment",
        amountToFinance: "Amount to finance",
        annualNetBenefit: "Annual net benefit",
        totalRentalCost: "Total rental cost",
        extraCostVsPurchase: "Extra cost vs. purchase",
        totalBenefitOverPeriod: "Total benefit over term",
        yearlyCostsWithoutWith: "Cost/year without / with",
      },
      units: {
        months: "months",
        years: "years",
        weeks: "weeks",
        monthShort: "months",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Passenger car up to 2.0L displacement", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Vans, trucks & SUVs up to 7.5t", cost: 450 },
          { value: "LKW_18T", label: "Truck up to 18t", cost: 750 },
          { value: "LKW_40T", label: "Truck up to 40t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Small construction machinery 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Medium construction machinery 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Large construction machinery 18-35 l/h", cost: 1450 },
        ],
      },
    },

    es: {
      actions: { reset: "Restablecer" },
      labels: {
        formTitle: "Tus datos",
        calcMode: "Modo",
        financeModel: "Modelo de financiación",
        vehicleType: "Tipo de vehículo",
        fuelPrice: "Precio del combustible",
        systemCost: "Coste FET (€)",
        savingPct: "Ahorro de combustible (%)",
        downPaymentPct: "Pago inicial (%)",
        rentalDuration: "Duración del alquiler (máx. 48 meses)",
        financeRate: "Tipo de financiación anual",
        annualKm: "Kilometraje anual (km/año)",
        annualH: "Horas de funcionamiento anuales (h/año)",
        consKm: "Consumo (l/100 km)",
        consH: "Consumo (l/h)",
        annualPlaceholderKm: "p. ej. 35.000",
        annualPlaceholderH: "p. ej. 900",
        consPlaceholderKm: "p. ej. 11,5",
        consPlaceholderH: "p. ej. 45",
      },
      modeOptions: {
        km: "Kilómetros (l/100 km)",
        h: "Horas de funcionamiento (l/h)",
      },
      financeOptions: {
        purchase: "Compra",
        rental: "Alquiler",
      },
      results: {
        kicker: "Resultado",
        yearlySaving: "Ahorro anual",
        monthlyNetBenefit: "Beneficio neto mensual",
        payback: "Amortización",
        rentalBreakEven: "Punto de equilibrio del alquiler",
        yearlyCosts: "Costes/año",
        monthlyRentalPayment: "Cuota mensual",
        time: "Tiempo",
        withoutWith: "sin / con",
        perMonth: "por mes",
        rentalDetails: "Detalles del alquiler",
        downPaymentEuro: "Pago inicial",
        amountToFinance: "Importe a financiar",
        annualNetBenefit: "Beneficio neto anual",
        totalRentalCost: "Coste total del alquiler",
        extraCostVsPurchase: "Coste adicional frente a compra",
        totalBenefitOverPeriod: "Beneficio total durante el plazo",
        yearlyCostsWithoutWith: "Costes/año sin / con",
      },
      units: {
        months: "meses",
        years: "años",
        weeks: "semanas",
        monthShort: "meses",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Turismo hasta 2.0L de cilindrada", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Furgonetas, camiones y SUV hasta 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Camión hasta 18 t", cost: 750 },
          { value: "LKW_40T", label: "Camión hasta 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Maquinaria de obra pequeña 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Maquinaria de obra mediana 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Maquinaria de obra grande 18-35 l/h", cost: 1450 },
        ],
      },
    },

    fr: {
      actions: { reset: "Réinitialiser" },
      labels: {
        formTitle: "Vos données",
        calcMode: "Mode",
        financeModel: "Mode de financement",
        vehicleType: "Type de véhicule",
        fuelPrice: "Prix du carburant",
        systemCost: "Coût FET (€)",
        savingPct: "Économie de carburant (%)",
        downPaymentPct: "Acompte (%)",
        rentalDuration: "Durée de location (max. 48 mois)",
        financeRate: "Taux de financement annuel",
        annualKm: "Kilométrage annuel (km/an)",
        annualH: "Heures de fonctionnement annuelles (h/an)",
        consKm: "Consommation (l/100 km)",
        consH: "Consommation (l/h)",
        annualPlaceholderKm: "ex. 35 000",
        annualPlaceholderH: "ex. 900",
        consPlaceholderKm: "ex. 11,5",
        consPlaceholderH: "ex. 45",
      },
      modeOptions: {
        km: "Kilomètres (l/100 km)",
        h: "Heures de fonctionnement (l/h)",
      },
      financeOptions: {
        purchase: "Achat",
        rental: "Location",
      },
      results: {
        kicker: "Résultat",
        yearlySaving: "Économies annuelles",
        monthlyNetBenefit: "Avantage net mensuel",
        payback: "Amortissement",
        rentalBreakEven: "Seuil de rentabilité de la location",
        yearlyCosts: "Coûts/an",
        monthlyRentalPayment: "Mensualité de location",
        time: "Durée",
        withoutWith: "sans / avec",
        perMonth: "par mois",
        rentalDetails: "Détails de location",
        downPaymentEuro: "Acompte",
        amountToFinance: "Montant à financer",
        annualNetBenefit: "Avantage net annuel",
        totalRentalCost: "Coût total de location",
        extraCostVsPurchase: "Surcoût par rapport à l’achat",
        totalBenefitOverPeriod: "Avantage total sur la durée",
        yearlyCostsWithoutWith: "Coûts/an sans / avec",
      },
      units: {
        months: "mois",
        years: "ans",
        weeks: "semaines",
        monthShort: "mois",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Voiture particulière jusqu’à 2,0 l de cylindrée", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Vans, camions et SUV jusqu’à 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Camion jusqu’à 18 t", cost: 750 },
          { value: "LKW_40T", label: "Camion jusqu’à 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Petites machines de chantier 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Machines de chantier moyennes 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Grandes machines de chantier 18-35 l/h", cost: 1450 },
        ],
      },
    },

    it: {
      actions: { reset: "Reimposta" },
      labels: {
        formTitle: "I tuoi dati",
        calcMode: "Modalità",
        financeModel: "Modello di finanziamento",
        vehicleType: "Tipo di veicolo",
        fuelPrice: "Prezzo del carburante",
        systemCost: "Costo FET (€)",
        savingPct: "Risparmio di carburante (%)",
        downPaymentPct: "Anticipo (%)",
        rentalDuration: "Durata del noleggio (max. 48 mesi)",
        financeRate: "Tasso di finanziamento annuo",
        annualKm: "Chilometraggio annuo (km/anno)",
        annualH: "Ore di esercizio annuali (h/anno)",
        consKm: "Consumo (l/100 km)",
        consH: "Consumo (l/h)",
        annualPlaceholderKm: "es. 35.000",
        annualPlaceholderH: "es. 900",
        consPlaceholderKm: "es. 11,5",
        consPlaceholderH: "es. 45",
      },
      modeOptions: {
        km: "Chilometri (l/100 km)",
        h: "Ore di esercizio (l/h)",
      },
      financeOptions: {
        purchase: "Acquisto",
        rental: "Noleggio",
      },
      results: {
        kicker: "Risultato",
        yearlySaving: "Risparmio annuo",
        monthlyNetBenefit: "Vantaggio netto mensile",
        payback: "Ammortamento",
        rentalBreakEven: "Break-even del noleggio",
        yearlyCosts: "Costi/anno",
        monthlyRentalPayment: "Canone mensile",
        time: "Tempo",
        withoutWith: "senza / con",
        perMonth: "al mese",
        rentalDetails: "Dettagli del noleggio",
        downPaymentEuro: "Anticipo",
        amountToFinance: "Importo da finanziare",
        annualNetBenefit: "Vantaggio netto annuo",
        totalRentalCost: "Costo totale del noleggio",
        extraCostVsPurchase: "Costo extra rispetto all’acquisto",
        totalBenefitOverPeriod: "Vantaggio totale sul periodo",
        yearlyCostsWithoutWith: "Costi/anno senza / con",
      },
      units: {
        months: "mesi",
        years: "anni",
        weeks: "settimane",
        monthShort: "mesi",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Autovettura fino a 2.0L di cilindrata", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Furgoni, camion e SUV fino a 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Camion fino a 18 t", cost: 750 },
          { value: "LKW_40T", label: "Camion fino a 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Piccole macchine da cantiere 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Medie macchine da cantiere 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Grandi macchine da cantiere 18-35 l/h", cost: 1450 },
        ],
      },
    },

    nl: {
      actions: { reset: "Resetten" },
      labels: {
        formTitle: "Jouw gegevens",
        calcMode: "Modus",
        financeModel: "Financieringsmodel",
        vehicleType: "Voertuigtype",
        fuelPrice: "Brandstofprijs",
        systemCost: "FET-kosten (€)",
        savingPct: "Brandstofbesparing (%)",
        downPaymentPct: "Aanbetaling (%)",
        rentalDuration: "Looptijd huur (max. 48 maanden)",
        financeRate: "Financieringsrente p.j.",
        annualKm: "Jaarlijkse rijafstand (km/jaar)",
        annualH: "Jaarlijkse bedrijfsuren (u/jaar)",
        consKm: "Verbruik (l/100 km)",
        consH: "Verbruik (l/u)",
        annualPlaceholderKm: "bijv. 35.000",
        annualPlaceholderH: "bijv. 900",
        consPlaceholderKm: "bijv. 11,5",
        consPlaceholderH: "bijv. 45",
      },
      modeOptions: {
        km: "Kilometers (l/100 km)",
        h: "Bedrijfsuren (l/u)",
      },
      financeOptions: {
        purchase: "Koop",
        rental: "Huur",
      },
      results: {
        kicker: "Resultaat",
        yearlySaving: "Jaarlijkse besparing",
        monthlyNetBenefit: "Maandelijks netto voordeel",
        payback: "Terugverdientijd",
        rentalBreakEven: "Break-even huur",
        yearlyCosts: "Kosten/jaar",
        monthlyRentalPayment: "Huurtarief/maand",
        time: "Tijd",
        withoutWith: "zonder / met",
        perMonth: "per maand",
        rentalDetails: "Huurdetails",
        downPaymentEuro: "Aanbetaling",
        amountToFinance: "Te financieren bedrag",
        annualNetBenefit: "Jaarlijks netto voordeel",
        totalRentalCost: "Totale huurkosten",
        extraCostVsPurchase: "Meerprijs t.o.v. koop",
        totalBenefitOverPeriod: "Totaal voordeel over looptijd",
        yearlyCostsWithoutWith: "Kosten/jaar zonder / met",
      },
      units: {
        months: "maanden",
        years: "jaar",
        weeks: "weken",
        monthShort: "maanden",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Personenauto tot 2,0L cilinderinhoud", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Bestelbussen, vrachtwagens & SUV's tot 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Vrachtwagen tot 18 t", cost: 750 },
          { value: "LKW_40T", label: "Vrachtwagen tot 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Kleine bouwmachines 1-3 l/u", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Middelgrote bouwmachines 4-8 l/u", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Grote bouwmachines 18-35 l/u", cost: 1450 },
        ],
      },
    },

    ru: {
      actions: { reset: "Сбросить" },
      labels: {
        formTitle: "Ваши данные",
        calcMode: "Режим",
        financeModel: "Модель финансирования",
        vehicleType: "Тип транспортного средства",
        fuelPrice: "Цена топлива",
        systemCost: "Стоимость FET (€)",
        savingPct: "Экономия топлива (%)",
        downPaymentPct: "Первоначальный взнос (%)",
        rentalDuration: "Срок аренды (макс. 48 мес.)",
        financeRate: "Ставка финансирования в год",
        annualKm: "Годовой пробег (км/год)",
        annualH: "Годовые моточасы (ч/год)",
        consKm: "Расход (л/100 км)",
        consH: "Расход (л/ч)",
        annualPlaceholderKm: "напр. 35 000",
        annualPlaceholderH: "напр. 900",
        consPlaceholderKm: "напр. 11,5",
        consPlaceholderH: "напр. 45",
      },
      modeOptions: {
        km: "Километры (л/100 км)",
        h: "Моточасы (л/ч)",
      },
      financeOptions: {
        purchase: "Покупка",
        rental: "Аренда",
      },
      results: {
        kicker: "Результат",
        yearlySaving: "Годовая экономия",
        monthlyNetBenefit: "Ежемесячная чистая выгода",
        payback: "Окупаемость",
        rentalBreakEven: "Точка безубыточности аренды",
        yearlyCosts: "Затраты/год",
        monthlyRentalPayment: "Платёж/месяц",
        time: "Срок",
        withoutWith: "без / с",
        perMonth: "в месяц",
        rentalDetails: "Детали аренды",
        downPaymentEuro: "Первоначальный взнос",
        amountToFinance: "Сумма финансирования",
        annualNetBenefit: "Годовая чистая выгода",
        totalRentalCost: "Общая стоимость аренды",
        extraCostVsPurchase: "Доп. стоимость по сравнению с покупкой",
        totalBenefitOverPeriod: "Общая выгода за срок",
        yearlyCostsWithoutWith: "Затраты/год без / с",
      },
      units: {
        months: "мес.",
        years: "лет",
        weeks: "нед.",
        monthShort: "мес.",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Легковой автомобиль до 2,0 л", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Фургоны, грузовики и SUV до 7,5 т", cost: 450 },
          { value: "LKW_18T", label: "Грузовик до 18 т", cost: 750 },
          { value: "LKW_40T", label: "Грузовик до 40 т", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Малая строительная техника 1-3 л/ч", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Средняя строительная техника 4-8 л/ч", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Крупная строительная техника 18-35 л/ч", cost: 1450 },
        ],
      },
    },

    tr: {
      actions: { reset: "Sıfırla" },
      labels: {
        formTitle: "Bilgileriniz",
        calcMode: "Mod",
        financeModel: "Finansman modeli",
        vehicleType: "Araç tipi",
        fuelPrice: "Yakıt fiyatı",
        systemCost: "FET maliyeti (€)",
        savingPct: "Yakıt tasarrufu (%)",
        downPaymentPct: "Peşinat (%)",
        rentalDuration: "Kiralama süresi (maks. 48 ay)",
        financeRate: "Yıllık finansman faizi",
        annualKm: "Yıllık kilometre (km/yıl)",
        annualH: "Yıllık çalışma saati (saat/yıl)",
        consKm: "Tüketim (l/100 km)",
        consH: "Tüketim (l/saat)",
        annualPlaceholderKm: "örn. 35.000",
        annualPlaceholderH: "örn. 900",
        consPlaceholderKm: "örn. 11,5",
        consPlaceholderH: "örn. 45",
      },
      modeOptions: {
        km: "Kilometre (l/100 km)",
        h: "Çalışma saati (l/saat)",
      },
      financeOptions: {
        purchase: "Satın alma",
        rental: "Kiralama",
      },
      results: {
        kicker: "Sonuç",
        yearlySaving: "Yıllık tasarruf",
        monthlyNetBenefit: "Aylık net avantaj",
        payback: "Amortisman",
        rentalBreakEven: "Kiralama başabaş noktası",
        yearlyCosts: "Yıllık maliyet",
        monthlyRentalPayment: "Aylık kira ödemesi",
        time: "Süre",
        withoutWith: "olmadan / ile",
        perMonth: "aylık",
        rentalDetails: "Kiralama detayları",
        downPaymentEuro: "Peşinat",
        amountToFinance: "Finanse edilecek tutar",
        annualNetBenefit: "Yıllık net avantaj",
        totalRentalCost: "Toplam kiralama maliyeti",
        extraCostVsPurchase: "Satın almaya göre ek maliyet",
        totalBenefitOverPeriod: "Süre boyunca toplam avantaj",
        yearlyCostsWithoutWith: "Yıllık maliyet olmadan / ile",
      },
      units: {
        months: "ay",
        years: "yıl",
        weeks: "hafta",
        monthShort: "ay",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "2.0L motor hacmine kadar binek araç", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Panelvan, kamyon ve SUV 7,5 tona kadar", cost: 450 },
          { value: "LKW_18T", label: "18 tona kadar kamyon", cost: 750 },
          { value: "LKW_40T", label: "40 tona kadar kamyon", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Küçük iş makineleri 1-3 l/saat", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Orta iş makineleri 4-8 l/saat", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Büyük iş makineleri 18-35 l/saat", cost: 1450 },
        ],
      },
    },

    hr: {
      actions: { reset: "Poništi" },
      labels: {
        formTitle: "Vaši podaci",
        calcMode: "Način",
        financeModel: "Model financiranja",
        vehicleType: "Vrsta vozila",
        fuelPrice: "Cijena goriva",
        systemCost: "FET trošak (€)",
        savingPct: "Ušteda goriva (%)",
        downPaymentPct: "Predujam (%)",
        rentalDuration: "Trajanje najma (maks. 48 mjeseci)",
        financeRate: "Godišnja kamatna stopa financiranja",
        annualKm: "Godišnja kilometraža (km/god)",
        annualH: "Godišnji radni sati (h/god)",
        consKm: "Potrošnja (l/100 km)",
        consH: "Potrošnja (l/h)",
        annualPlaceholderKm: "npr. 35.000",
        annualPlaceholderH: "npr. 900",
        consPlaceholderKm: "npr. 11,5",
        consPlaceholderH: "npr. 45",
      },
      modeOptions: {
        km: "Kilometri (l/100 km)",
        h: "Radni sati (l/h)",
      },
      financeOptions: {
        purchase: "Kupnja",
        rental: "Najam",
      },
      results: {
        kicker: "Rezultat",
        yearlySaving: "Godišnja ušteda",
        monthlyNetBenefit: "Mjesečna neto korist",
        payback: "Povrat ulaganja",
        rentalBreakEven: "Točka pokrića najma",
        yearlyCosts: "Trošak/god",
        monthlyRentalPayment: "Mjesečna rata najma",
        time: "Vrijeme",
        withoutWith: "bez / s",
        perMonth: "mjesečno",
        rentalDetails: "Detalji najma",
        downPaymentEuro: "Predujam",
        amountToFinance: "Iznos za financiranje",
        annualNetBenefit: "Godišnja neto korist",
        totalRentalCost: "Ukupni trošak najma",
        extraCostVsPurchase: "Dodatni trošak u odnosu na kupnju",
        totalBenefitOverPeriod: "Ukupna korist tijekom razdoblja",
        yearlyCostsWithoutWith: "Trošak/god bez / s",
      },
      units: {
        months: "mjeseci",
        years: "godina",
        weeks: "tjedana",
        monthShort: "mjeseci",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Osobni automobil do 2,0L obujma motora", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Kombiji, kamioni i SUV vozila do 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Kamion do 18 t", cost: 750 },
          { value: "LKW_40T", label: "Kamion do 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Mali građevinski strojevi 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Srednji građevinski strojevi 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Veliki građevinski strojevi 18-35 l/h", cost: 1450 },
        ],
      },
    },

    el: {
      actions: { reset: "Επαναφορά" },
      labels: {
        formTitle: "Τα στοιχεία σας",
        calcMode: "Λειτουργία",
        financeModel: "Μοντέλο χρηματοδότησης",
        vehicleType: "Τύπος οχήματος",
        fuelPrice: "Τιμή καυσίμου",
        systemCost: "Κόστος FET (€)",
        savingPct: "Εξοικονόμηση καυσίμου (%)",
        downPaymentPct: "Προκαταβολή (%)",
        rentalDuration: "Διάρκεια μίσθωσης (έως 48 μήνες)",
        financeRate: "Ετήσιο επιτόκιο χρηματοδότησης",
        annualKm: "Ετήσια χιλιομετρική απόσταση (km/έτος)",
        annualH: "Ετήσιες ώρες λειτουργίας (h/έτος)",
        consKm: "Κατανάλωση (l/100 km)",
        consH: "Κατανάλωση (l/h)",
        annualPlaceholderKm: "π.χ. 35.000",
        annualPlaceholderH: "π.χ. 900",
        consPlaceholderKm: "π.χ. 11,5",
        consPlaceholderH: "π.χ. 45",
      },
      modeOptions: {
        km: "Χιλιόμετρα (l/100 km)",
        h: "Ώρες λειτουργίας (l/h)",
      },
      financeOptions: {
        purchase: "Αγορά",
        rental: "Μίσθωση",
      },
      results: {
        kicker: "Αποτέλεσμα",
        yearlySaving: "Ετήσια εξοικονόμηση",
        monthlyNetBenefit: "Μηνιαίο καθαρό όφελος",
        payback: "Απόσβεση",
        rentalBreakEven: "Σημείο ισορροπίας μίσθωσης",
        yearlyCosts: "Κόστος/έτος",
        monthlyRentalPayment: "Μηνιαία δόση μίσθωσης",
        time: "Χρόνος",
        withoutWith: "χωρίς / με",
        perMonth: "ανά μήνα",
        rentalDetails: "Στοιχεία μίσθωσης",
        downPaymentEuro: "Προκαταβολή",
        amountToFinance: "Ποσό προς χρηματοδότηση",
        annualNetBenefit: "Ετήσιο καθαρό όφελος",
        totalRentalCost: "Συνολικό κόστος μίσθωσης",
        extraCostVsPurchase: "Επιπλέον κόστος σε σχέση με αγορά",
        totalBenefitOverPeriod: "Συνολικό όφελος στη διάρκεια",
        yearlyCostsWithoutWith: "Κόστος/έτος χωρίς / με",
      },
      units: {
        months: "μήνες",
        years: "έτη",
        weeks: "εβδομάδες",
        monthShort: "μήνες",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Επιβατικό όχημα έως 2,0L κυβισμό", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Βαν, φορτηγά και SUV έως 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Φορτηγό έως 18 t", cost: 750 },
          { value: "LKW_40T", label: "Φορτηγό έως 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Μικρά μηχανήματα έργου 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Μεσαία μηχανήματα έργου 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Μεγάλα μηχανήματα έργου 18-35 l/h", cost: 1450 },
        ],
      },
    },

    pl: {
      actions: { reset: "Resetuj" },
      labels: {
        formTitle: "Twoje dane",
        calcMode: "Tryb",
        financeModel: "Model finansowania",
        vehicleType: "Typ pojazdu",
        fuelPrice: "Cena paliwa",
        systemCost: "Koszt FET (€)",
        savingPct: "Oszczędność paliwa (%)",
        downPaymentPct: "Wpłata początkowa (%)",
        rentalDuration: "Okres najmu (maks. 48 miesięcy)",
        financeRate: "Roczna stopa finansowania",
        annualKm: "Roczny przebieg (km/rok)",
        annualH: "Roczne godziny pracy (h/rok)",
        consKm: "Zużycie (l/100 km)",
        consH: "Zużycie (l/h)",
        annualPlaceholderKm: "np. 35 000",
        annualPlaceholderH: "np. 900",
        consPlaceholderKm: "np. 11,5",
        consPlaceholderH: "np. 45",
      },
      modeOptions: {
        km: "Kilometry (l/100 km)",
        h: "Godziny pracy (l/h)",
      },
      financeOptions: {
        purchase: "Zakup",
        rental: "Najem",
      },
      results: {
        kicker: "Wynik",
        yearlySaving: "Roczna oszczędność",
        monthlyNetBenefit: "Miesięczna korzyść netto",
        payback: "Zwrot",
        rentalBreakEven: "Próg rentowności najmu",
        yearlyCosts: "Koszt/rok",
        monthlyRentalPayment: "Rata najmu/miesiąc",
        time: "Czas",
        withoutWith: "bez / z",
        perMonth: "miesięcznie",
        rentalDetails: "Szczegóły najmu",
        downPaymentEuro: "Wpłata początkowa",
        amountToFinance: "Kwota do sfinansowania",
        annualNetBenefit: "Roczna korzyść netto",
        totalRentalCost: "Całkowity koszt najmu",
        extraCostVsPurchase: "Dodatkowy koszt względem zakupu",
        totalBenefitOverPeriod: "Całkowita korzyść w okresie",
        yearlyCostsWithoutWith: "Koszt/rok bez / z",
      },
      units: {
        months: "miesięcy",
        years: "lat",
        weeks: "tygodni",
        monthShort: "miesięcy",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Samochód osobowy do 2,0L pojemności silnika", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Vany, ciężarówki i SUV-y do 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Ciężarówka do 18 t", cost: 750 },
          { value: "LKW_40T", label: "Ciężarówka do 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Małe maszyny budowlane 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Średnie maszyny budowlane 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Duże maszyny budowlane 18-35 l/h", cost: 1450 },
        ],
      },
    },

    sq: {
      actions: { reset: "Rivendos" },
      labels: {
        formTitle: "Të dhënat tuaja",
        calcMode: "Mënyra",
        financeModel: "Modeli i financimit",
        vehicleType: "Lloji i mjetit",
        fuelPrice: "Çmimi i karburantit",
        systemCost: "Kostoja FET (€)",
        savingPct: "Kursimi i karburantit (%)",
        downPaymentPct: "Parapagimi (%)",
        rentalDuration: "Kohëzgjatja e qirasë (maks. 48 muaj)",
        financeRate: "Norma e financimit vjetor",
        annualKm: "Kilometrazhi vjetor (km/vit)",
        annualH: "Orët vjetore të punës (h/vit)",
        consKm: "Konsumi (l/100 km)",
        consH: "Konsumi (l/h)",
        annualPlaceholderKm: "p.sh. 35.000",
        annualPlaceholderH: "p.sh. 900",
        consPlaceholderKm: "p.sh. 11,5",
        consPlaceholderH: "p.sh. 45",
      },
      modeOptions: {
        km: "Kilometra (l/100 km)",
        h: "Orë pune (l/h)",
      },
      financeOptions: {
        purchase: "Blerje",
        rental: "Qira",
      },
      results: {
        kicker: "Rezultati",
        yearlySaving: "Kursimi vjetor",
        monthlyNetBenefit: "Përfitimi neto mujor",
        payback: "Shlyerja",
        rentalBreakEven: "Pika e barazimit të qirasë",
        yearlyCosts: "Kosto/vit",
        monthlyRentalPayment: "Pagesa mujore e qirasë",
        time: "Koha",
        withoutWith: "pa / me",
        perMonth: "në muaj",
        rentalDetails: "Detajet e qirasë",
        downPaymentEuro: "Parapagimi",
        amountToFinance: "Shuma për financim",
        annualNetBenefit: "Përfitimi neto vjetor",
        totalRentalCost: "Kostoja totale e qirasë",
        extraCostVsPurchase: "Kosto shtesë kundrejt blerjes",
        totalBenefitOverPeriod: "Përfitimi total gjatë periudhës",
        yearlyCostsWithoutWith: "Kosto/vit pa / me",
      },
      units: {
        months: "muaj",
        years: "vite",
        weeks: "javë",
        monthShort: "muaj",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Automjet pasagjerësh deri në 2,0L kubaturë", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Furgonë, kamionë dhe SUV deri në 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Kamion deri në 18 t", cost: 750 },
          { value: "LKW_40T", label: "Kamion deri në 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Makineri të vogla ndërtimi 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Makineri mesatare ndërtimi 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Makineri të mëdha ndërtimi 18-35 l/h", cost: 1450 },
        ],
      },
    },

    cs: {
      actions: { reset: "Resetovat" },
      labels: {
        formTitle: "Vaše údaje",
        calcMode: "Režim",
        financeModel: "Model financování",
        vehicleType: "Typ vozidla",
        fuelPrice: "Cena paliva",
        systemCost: "Cena FET (€)",
        savingPct: "Úspora paliva (%)",
        downPaymentPct: "Akontace (%)",
        rentalDuration: "Doba pronájmu (max. 48 měsíců)",
        financeRate: "Roční úrok financování",
        annualKm: "Roční nájezd (km/rok)",
        annualH: "Roční provozní hodiny (h/rok)",
        consKm: "Spotřeba (l/100 km)",
        consH: "Spotřeba (l/h)",
        annualPlaceholderKm: "např. 35 000",
        annualPlaceholderH: "např. 900",
        consPlaceholderKm: "např. 11,5",
        consPlaceholderH: "např. 45",
      },
      modeOptions: {
        km: "Kilometry (l/100 km)",
        h: "Provozní hodiny (l/h)",
      },
      financeOptions: {
        purchase: "Koupě",
        rental: "Pronájem",
      },
      results: {
        kicker: "Výsledek",
        yearlySaving: "Roční úspora",
        monthlyNetBenefit: "Měsíční čistý přínos",
        payback: "Návratnost",
        rentalBreakEven: "Bod zvratu pronájmu",
        yearlyCosts: "Náklady/rok",
        monthlyRentalPayment: "Měsíční splátka pronájmu",
        time: "Čas",
        withoutWith: "bez / s",
        perMonth: "za měsíc",
        rentalDetails: "Detaily pronájmu",
        downPaymentEuro: "Akontace",
        amountToFinance: "Částka k financování",
        annualNetBenefit: "Roční čistý přínos",
        totalRentalCost: "Celkové náklady pronájmu",
        extraCostVsPurchase: "Dodatečné náklady oproti koupi",
        totalBenefitOverPeriod: "Celkový přínos za období",
        yearlyCostsWithoutWith: "Náklady/rok bez / s",
      },
      units: {
        months: "měsíců",
        years: "let",
        weeks: "týdnů",
        monthShort: "měsíců",
      },
      vehicleOptionsByMode: {
        km: [
          { value: "PKW", label: "Osobní automobil do 2,0L objemu motoru", cost: 250 },
          { value: "SPRINTER_7_5T", label: "Dodávky, nákladní vozy a SUV do 7,5 t", cost: 450 },
          { value: "LKW_18T", label: "Nákladní vůz do 18 t", cost: 750 },
          { value: "LKW_40T", label: "Nákladní vůz do 40 t", cost: 1450 },
        ],
        h: [
          { value: "BM_SMALL_1_3", label: "Malé stavební stroje 1-3 l/h", cost: 250 },
          { value: "BM_MEDIUM_4_8", label: "Střední stavební stroje 4-8 l/h", cost: 750 },
          { value: "BM_LARGE_18_35", label: "Velké stavební stroje 18-35 l/h", cost: 1450 },
        ],
      },
    },
  };

  const T = I18N[LANG] || I18N.en || I18N.de;

  const VEHICLE_OPTIONS_BY_MODE = T.vehicleOptionsByMode;

  const VEHICLE_COSTS = [
    {
      test: (s) =>
        s.includes("bm large") ||
        s.includes("grosse baumaschinen") ||
        s.includes("large construction") ||
        s.includes("grandes machines") ||
        s.includes("grandi macchine") ||
        s.includes("grote bouwmachines") ||
        s.includes("крупная строительная") ||
        s.includes("büyük iş makineleri") ||
        s.includes("veliki građevinski") ||
        s.includes("μεγάλα μηχανήματα") ||
        s.includes("duże maszyny budowlane") ||
        s.includes("makineri të mëdha ndërtimi") ||
        s.includes("velké stavební stroje") ||
        s.includes("18 35"),
      cost: 1450
    },
    {
      test: (s) =>
        s.includes("bm medium") ||
        s.includes("mittlere baumaschinen") ||
        s.includes("medium construction") ||
        s.includes("machines de chantier moyennes") ||
        s.includes("medie macchine") ||
        s.includes("middelgrote bouwmachines") ||
        s.includes("средняя строительная") ||
        s.includes("orta iş makineleri") ||
        s.includes("srednji građevinski") ||
        s.includes("μεσαία μηχανήματα") ||
        s.includes("średnie maszyny budowlane") ||
        s.includes("makineri mesatare ndërtimi") ||
        s.includes("střední stavební stroje") ||
        s.includes("4 8"),
      cost: 750
    },
    {
      test: (s) =>
        s.includes("bm small") ||
        s.includes("kleine baumaschinen") ||
        s.includes("small construction") ||
        s.includes("petites machines") ||
        s.includes("piccole macchine") ||
        s.includes("kleine bouwmachines") ||
        s.includes("малая строительная") ||
        s.includes("küçük iş makineleri") ||
        s.includes("mali građevinski") ||
        s.includes("μικρά μηχανήματα") ||
        s.includes("małe maszyny budowlane") ||
        s.includes("makineri të vogla ndërtimi") ||
        s.includes("malé stavební stroje") ||
        s.includes("1 3"),
      cost: 250
    },
    { test: (s) => s.includes("40"), cost: 1450 },
    { test: (s) => s.includes("18"), cost: 750 },
    {
      test: (s) =>
        s.includes("7.5") ||
        s.includes("7,5") ||
        s.includes("7 5") ||
        s.includes("sprinter") ||
        s.includes("suv") ||
        s.includes("van") ||
        s.includes("furgon") ||
        s.includes("bestelbus") ||
        s.includes("фургон") ||
        s.includes("panelvan") ||
        s.includes("kombi") ||
        s.includes("φορτηγ") ||
        s.includes("dodávk") ||
        s.includes("furgonë"),
      cost: 450
    },
    {
      test: (s) =>
        s.includes("pkw") ||
        s.includes("pwk") ||
        s.includes("car") ||
        s.includes("auto") ||
        s.includes("passenger car") ||
        s.includes("turismo") ||
        s.includes("voiture") ||
        s.includes("autovettura") ||
        s.includes("personenauto") ||
        s.includes("легковой") ||
        s.includes("binek araç") ||
        s.includes("osobni automobil") ||
        s.includes("επιβατικό") ||
        s.includes("samochód osobowy") ||
        s.includes("automjet pasagjerësh") ||
        s.includes("osobní automobil"),
      cost: 250
    },
  ];

  function detectLocale() {
    const lang = (document.documentElement.getAttribute("lang") || LANG || "de").toLowerCase();
    if (lang.startsWith("de")) return "de-DE";
    if (lang.startsWith("fr")) return "fr-FR";
    if (lang.startsWith("it")) return "it-IT";
    if (lang.startsWith("nl")) return "nl-NL";
    if (lang.startsWith("es")) return "es-ES";
    if (lang.startsWith("tr")) return "tr-TR";
    if (lang.startsWith("ru")) return "ru-RU";
    if (lang.startsWith("hr")) return "hr-HR";
    if (lang.startsWith("el")) return "el-GR";
    if (lang.startsWith("pl")) return "pl-PL";
    if (lang.startsWith("sq")) return "sq-AL";
    if (lang.startsWith("cs")) return "cs-CZ";
    return "en-GB";
  }

  function normalizeVehicle(raw) {
    return String(raw ?? "")
      .toLowerCase()
      .replace(/[_\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getVehicleCost(vehicleRaw, modeRaw = "km") {
    const mode = modeRaw === "h" ? "h" : "km";
    const raw = String(vehicleRaw ?? "");
    const rawLower = raw.toLowerCase();

    const modeOptions = VEHICLE_OPTIONS_BY_MODE[mode] || [];
    const exact = modeOptions.find((o) => String(o.value).toLowerCase() === rawLower);
    if (exact) return exact.cost;

    const s = normalizeVehicle(raw);
    for (const r of VEHICLE_COSTS) {
      if (r.test(s)) return r.cost;
    }

    return NaN;
  }

  function parseNumber(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim();
    if (!s) return NaN;

    s = s.replace(/[^\d.,'\-\s]/g, "");
    s = s.replace(/\s+/g, "");
    s = s.replace(/'/g, "");

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    const commaThousandsPattern = /^-?\d{1,3}(,\d{3})+$/;
    const dotThousandsPattern = /^-?\d{1,3}(\.\d{3})+$/;

    if (hasComma && hasDot) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
        s = s.replace(/\./g, "");
        s = s.replace(/,/g, ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (hasComma && !hasDot) {
      if (commaThousandsPattern.test(s)) {
        s = s.replace(/,/g, "");
      } else {
        s = s.replace(/,/g, ".");
      }
    } else if (hasDot && !hasComma) {
      if (dotThousandsPattern.test(s)) {
        s = s.replace(/\./g, "");
      }
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function fmtMoney(value, locale) {
    if (!Number.isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: CURRENCY,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${Math.round(value).toLocaleString(locale)} ${CURRENCY}`;
    }
  }

  function fmtNumber(value, locale, digits = 1) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function humanPayback(years, locale) {
    if (!Number.isFinite(years) || years === Infinity || years <= 0) return "—";

    const months = years * 12;
    const weeks = years * 52;

    if (months < 24) {
      const m = Math.round(months);
      return `${m} ${T.units.months} (${fmtNumber(years, locale, 1)} ${T.units.years})`;
    }

    return `${fmtNumber(years, locale, 1)} ${T.units.years} (${Math.round(weeks)} ${T.units.weeks})`;
  }

  function fmtMonthCount(months, locale) {
    if (!Number.isFinite(months) || months < 0) return "—";
    return `${fmtNumber(months, locale, 1)} ${T.units.months}`;
  }

  function monthlyPayment(principal, annualRatePct, months) {
    if (!Number.isFinite(principal) || !Number.isFinite(annualRatePct) || !Number.isFinite(months)) return NaN;
    if (principal <= 0 || months <= 0) return NaN;

    const annualRate = annualRatePct / 100;
    if (annualRate === 0) return principal / months;

    const r = annualRate / 12;
    return (principal * r) / (1 - Math.pow(1 + r, -months));
  }

  function computePurchase({ mode, annual, consumption, fuelPrice, systemCost, savingPct }) {
    const pct = clamp(savingPct, 0, 100);

    const fuelNo =
      mode === "h"
        ? annual * consumption
        : (annual * consumption) / 100;

    const costNo = fuelNo * fuelPrice;
    const fuelWith = fuelNo * (1 - pct / 100);
    const costWith = fuelWith * fuelPrice;

    const yearlySaving = costNo - costWith;
    const monthlySaving = yearlySaving / 12;
    const paybackYears = yearlySaving > 0 ? systemCost / yearlySaving : Infinity;

    return { fuelNo, fuelWith, costNo, costWith, yearlySaving, monthlySaving, paybackYears };
  }

  function computeRental({ systemCost, downPaymentPct, durationMonths, financeRatePct, monthlySaving, yearlySaving, costNo, costWith }) {
    const dpPct = clamp(downPaymentPct, 0, 100);
    const downPaymentEuro = systemCost * (dpPct / 100);
    const amountToFinance = systemCost - downPaymentEuro;
    const monthlyRentalPayment = monthlyPayment(amountToFinance, financeRatePct, durationMonths);
    const totalRentalCost = downPaymentEuro + monthlyRentalPayment * durationMonths;
    const extraCostVsPurchase = totalRentalCost - systemCost;
    const monthlyNetBenefit = monthlySaving - monthlyRentalPayment;
    const annualNetBenefit = monthlyNetBenefit * 12;
    const rentalBreakEvenMonth =
      monthlyNetBenefit > 0
        ? downPaymentEuro / monthlyNetBenefit
        : monthlyNetBenefit === 0
          ? 0
          : durationMonths;
    const totalBenefitOverPeriod = monthlySaving * durationMonths - totalRentalCost;

    return {
      downPaymentEuro,
      amountToFinance,
      monthlyRentalPayment,
      totalRentalCost,
      extraCostVsPurchase,
      monthlyNetBenefit,
      annualNetBenefit,
      rentalBreakEvenMonth,
      totalBenefitOverPeriod,
      yearlySaving,
      costNo,
      costWith,
    };
  }

  function flashResult(el) {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.remove("is-updating");
    void el.offsetWidth;
    el.classList.add("is-updating");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-calculator]") || document.getElementById("rechner");
    if (!root) return;

    const locale = detectLocale();

    const modeEl = $("#calcMode", root);
    const financeModelEl = $("#calcFinanceModel", root);
    const vehicleEl = $("#calcVehicleType", root);
    const annualEl = $("#calcAnnual", root);
    const consEl = $("#calcConsumption", root);
    const fuelEl = $("#calcFuelPrice", root);
    const systemCostEl = $("#calcSystemCost", root);
    const savingEl = $("#calcSavingPct", root);

    const downPaymentEl = $("#calcDownPaymentPct", root);
    const rentalDurationEl = $("#calcRentalDuration", root);
    const financeRateEl = $("#calcFinanceRate", root);

    const lblCalcMode = $("#lblCalcMode", root);
    const lblFinanceModel = $("#lblFinanceModel", root);
    const lblVehicleType = $("#lblVehicleType", root);
    const lblFuelPrice = $("#lblFuelPrice", root);
    const lblSystemCost = $("#lblSystemCost", root);
    const lblSavingPct = $("#lblSavingPct", root);
    const lblDownPaymentPct = $("#lblDownPaymentPct", root);
    const lblRentalDuration = $("#lblRentalDuration", root);
    const lblFinanceRate = $("#lblFinanceRate", root);
    const lblAnnual = $("#lblAnnual", root);
    const lblCons = $("#lblConsumption", root);

    const calcFormTitle = $("#calcFormTitle", root);
    const calcResultKicker = $("#calcResultKicker", root);
    const btnReset = $("#calcReset", root);
    const suffixRentalDuration = $("#suffixRentalDuration", root);

    const roiBig = $("#roiBig", root);
    const roiSub = $("#roiSub", root);
    const roiPrimary = $("#roiPrimary", root);
    const roiSecondary = $("#roiSecondary", root);
    const lblPrimaryStat = $("#lblPrimaryStat", root);
    const lblSecondaryStat = $("#lblSecondaryStat", root);
    const pillPrimary = $("#pillPrimary", root);
    const pillSecondary = $("#pillSecondary", root);
    const resultBox = $("#calcResult", root);

    const rentalPanel = $("#rentalPanel", root);
    const rentalOnlyEls = $$("[data-rental-only]", root);

    const lblRentalDetails = $("#lblRentalDetails", root);
    const lblRentDownPayment = $("#lblRentDownPayment", root);
    const lblRentAmountToFinance = $("#lblRentAmountToFinance", root);
    const lblRentAnnualNetBenefit = $("#lblRentAnnualNetBenefit", root);
    const lblRentTotalRentalCost = $("#lblRentTotalRentalCost", root);
    const lblRentExtraCostVsPurchase = $("#lblRentExtraCostVsPurchase", root);
    const lblRentTotalBenefit = $("#lblRentTotalBenefit", root);
    const lblRentYearlyCosts = $("#lblRentYearlyCosts", root);

    const rentDownPayment = $("#rentDownPayment", root);
    const rentAmountToFinance = $("#rentAmountToFinance", root);
    const rentAnnualNetBenefit = $("#rentAnnualNetBenefit", root);
    const rentTotalRentalCost = $("#rentTotalRentalCost", root);
    const rentExtraCostVsPurchase = $("#rentExtraCostVsPurchase", root);
    const rentTotalBenefit = $("#rentTotalBenefit", root);
    const rentYearlyCosts = $("#rentYearlyCosts", root);

    if (rentalDurationEl) {
      rentalDurationEl.min = "1";
      rentalDurationEl.max = "48";
    }

    const rememberedVehicleByMode = { km: null, h: null };

    function getModeKey() {
      return (modeEl?.value || "km") === "h" ? "h" : "km";
    }

    function getFinanceModelKey() {
      return (financeModelEl?.value || "purchase") === "rental" ? "rental" : "purchase";
    }

    function setText(el, value) {
      if (el) el.textContent = value;
    }

    function syncStaticTexts() {
      setText(calcFormTitle, T.labels.formTitle);
      setText(lblCalcMode, T.labels.calcMode);
      setText(lblFinanceModel, T.labels.financeModel);
      setText(lblVehicleType, T.labels.vehicleType);
      setText(lblFuelPrice, T.labels.fuelPrice);
      setText(lblSystemCost, T.labels.systemCost);
      setText(lblSavingPct, T.labels.savingPct);
      setText(lblDownPaymentPct, T.labels.downPaymentPct);
      setText(lblRentalDuration, T.labels.rentalDuration);
      setText(lblFinanceRate, T.labels.financeRate);
      setText(calcResultKicker, T.results.kicker);
      setText(btnReset, T.actions.reset);
      setText(suffixRentalDuration, T.units.monthShort);

      if (modeEl?.options?.[0]) modeEl.options[0].textContent = T.modeOptions.km;
      if (modeEl?.options?.[1]) modeEl.options[1].textContent = T.modeOptions.h;
      if (financeModelEl?.options?.[0]) financeModelEl.options[0].textContent = T.financeOptions.purchase;
      if (financeModelEl?.options?.[1]) financeModelEl.options[1].textContent = T.financeOptions.rental;

      setText(lblRentalDetails, T.results.rentalDetails);
      setText(lblRentDownPayment, T.results.downPaymentEuro);
      setText(lblRentAmountToFinance, T.results.amountToFinance);
      setText(lblRentAnnualNetBenefit, T.results.annualNetBenefit);
      setText(lblRentTotalRentalCost, T.results.totalRentalCost);
      setText(lblRentExtraCostVsPurchase, T.results.extraCostVsPurchase);
      setText(lblRentTotalBenefit, T.results.totalBenefitOverPeriod);
      setText(lblRentYearlyCosts, T.results.yearlyCostsWithoutWith);
    }

    function syncLabels() {
      const mode = modeEl?.value || "km";
      if (mode === "h") {
        setText(lblAnnual, T.labels.annualH);
        setText(lblCons, T.labels.consH);
        if (annualEl) annualEl.placeholder = T.labels.annualPlaceholderH;
        if (consEl) consEl.placeholder = T.labels.consPlaceholderH;
      } else {
        setText(lblAnnual, T.labels.annualKm);
        setText(lblCons, T.labels.consKm);
        if (annualEl) annualEl.placeholder = T.labels.annualPlaceholderKm;
        if (consEl) consEl.placeholder = T.labels.consPlaceholderKm;
      }
    }

    function syncVehicleOptions(forceDefault = false) {
      if (!vehicleEl) return;

      const mode = getModeKey();
      const currentMode = vehicleEl.dataset.modeKey || "";
      const currentValue = vehicleEl.value || "";

      if (currentMode && currentMode !== mode && currentValue) {
        rememberedVehicleByMode[currentMode] = currentValue;
      }

      const items = VEHICLE_OPTIONS_BY_MODE[mode] || [];
      if (!items.length) return;

      const optionsChanged =
        vehicleEl.dataset.modeKey !== mode ||
        vehicleEl.options.length !== items.length ||
        items.some((item, i) => {
          const opt = vehicleEl.options[i];
          return !opt || opt.value !== item.value || opt.textContent !== item.label;
        });

      if (optionsChanged) {
        vehicleEl.innerHTML = "";
        for (const item of items) {
          const opt = document.createElement("option");
          opt.value = item.value;
          opt.textContent = item.label;
          vehicleEl.appendChild(opt);
        }
        vehicleEl.dataset.modeKey = mode;
      }

      const preferred = forceDefault ? "" : (rememberedVehicleByMode[mode] || currentValue);
      const hasPreferred = !!preferred && items.some((item) => item.value === preferred);

      vehicleEl.value = hasPreferred ? preferred : items[0].value;
      rememberedVehicleByMode[mode] = vehicleEl.value;
    }

    function syncVehicleCost() {
      if (!systemCostEl) return;
      const cost = getVehicleCost(vehicleEl?.value ?? "", getModeKey());
      if (Number.isFinite(cost)) {
        systemCostEl.value = String(cost);
      }
      systemCostEl.setAttribute("readonly", "readonly");
      systemCostEl.setAttribute("inputmode", "numeric");
    }

    function syncFinanceVisibility() {
      const isRental = getFinanceModelKey() === "rental";
      rentalOnlyEls.forEach((el) => {
        el.hidden = !isRental;
      });
      if (rentalPanel) rentalPanel.hidden = !isRental;
      resultBox?.classList.toggle("is-rental", isRental);
    }

    function clearMainOutput() {
      setText(roiBig, "—");
      setText(roiSub, T.results.yearlySaving);
      setText(lblPrimaryStat, T.results.payback);
      setText(roiPrimary, "—");
      setText(pillPrimary, `• ${T.results.time}`);
      setText(lblSecondaryStat, T.results.yearlyCosts);
      setText(roiSecondary, "— / —");
      setText(pillSecondary, `• ${T.results.withoutWith}`);
    }

    function clearRentalDetails() {
      setText(rentDownPayment, "—");
      setText(rentAmountToFinance, "—");
      setText(rentAnnualNetBenefit, "—");
      setText(rentTotalRentalCost, "—");
      setText(rentExtraCostVsPurchase, "—");
      setText(rentTotalBenefit, "—");
      setText(rentYearlyCosts, "— / —");
    }

    function update() {
      const financeModel = getFinanceModelKey();
      syncFinanceVisibility();

      const mode = getModeKey();
      const annual = parseNumber(annualEl?.value);
      const consumption = parseNumber(consEl?.value);
      const fuelPrice = parseNumber(fuelEl?.value);
      const systemCost = parseNumber(systemCostEl?.value);
      const savingPct = parseNumber(savingEl?.value);

      const coreOk = [annual, consumption, fuelPrice, systemCost, savingPct].every(Number.isFinite);

      if (!coreOk || annual <= 0 || consumption <= 0 || fuelPrice <= 0 || systemCost <= 0) {
        clearMainOutput();
        clearRentalDetails();
        return;
      }

      const purchase = computePurchase({
        mode,
        annual,
        consumption,
        fuelPrice,
        systemCost,
        savingPct
      });

      if (financeModel === "purchase") {
        setText(roiBig, fmtMoney(purchase.yearlySaving, locale));
        setText(roiSub, T.results.yearlySaving);
        setText(lblPrimaryStat, T.results.payback);
        setText(roiPrimary, humanPayback(purchase.paybackYears, locale));
        setText(pillPrimary, `• ${T.results.time}`);
        setText(lblSecondaryStat, T.results.yearlyCosts);
        setText(roiSecondary, `${fmtMoney(purchase.costNo, locale)} / ${fmtMoney(purchase.costWith, locale)}`);
        setText(pillSecondary, `• ${T.results.withoutWith}`);
        clearRentalDetails();
        flashResult(resultBox);
        return;
      }

      const downPaymentPct = parseNumber(downPaymentEl?.value);
      const durationMonths = parseNumber(rentalDurationEl?.value);
      const financeRatePct = parseNumber(financeRateEl?.value);

      const rentalOk = [downPaymentPct, durationMonths, financeRatePct].every(Number.isFinite);

      if (!rentalOk || durationMonths <= 0 || durationMonths > 48 || downPaymentPct < 0 || financeRatePct < 0) {
        setText(roiBig, "—");
        setText(roiSub, T.results.monthlyNetBenefit);
        setText(lblPrimaryStat, T.results.rentalBreakEven);
        setText(roiPrimary, "—");
        setText(pillPrimary, `• ${T.results.time}`);
        setText(lblSecondaryStat, T.results.monthlyRentalPayment);
        setText(roiSecondary, "—");
        setText(pillSecondary, `• ${T.results.perMonth}`);
        clearRentalDetails();
        return;
      }

      const rental = computeRental({
        systemCost,
        downPaymentPct,
        durationMonths,
        financeRatePct,
        monthlySaving: purchase.monthlySaving,
        yearlySaving: purchase.yearlySaving,
        costNo: purchase.costNo,
        costWith: purchase.costWith
      });

      setText(roiBig, fmtMoney(rental.monthlyNetBenefit, locale));
      setText(roiSub, T.results.monthlyNetBenefit);

      setText(lblPrimaryStat, T.results.rentalBreakEven);
      setText(roiPrimary, fmtMonthCount(rental.rentalBreakEvenMonth, locale));
      setText(pillPrimary, `• ${T.results.time}`);

      setText(lblSecondaryStat, T.results.monthlyRentalPayment);
      setText(roiSecondary, fmtMoney(rental.monthlyRentalPayment, locale));
      setText(pillSecondary, `• ${T.results.perMonth}`);

      setText(rentDownPayment, fmtMoney(rental.downPaymentEuro, locale));
      setText(rentAmountToFinance, fmtMoney(rental.amountToFinance, locale));
      setText(rentAnnualNetBenefit, fmtMoney(rental.annualNetBenefit, locale));
      setText(rentTotalRentalCost, fmtMoney(rental.totalRentalCost, locale));
      setText(rentExtraCostVsPurchase, fmtMoney(rental.extraCostVsPurchase, locale));
      setText(rentTotalBenefit, fmtMoney(rental.totalBenefitOverPeriod, locale));
      setText(rentYearlyCosts, `${fmtMoney(rental.costNo, locale)} / ${fmtMoney(rental.costWith, locale)}`);

      flashResult(resultBox);
    }

    function rafUpdate() {
      window.requestAnimationFrame(update);
    }

    const defaults = {
      mode: modeEl?.value || "km",
      financeModel: financeModelEl?.value || "purchase",
      vehicle: vehicleEl?.value || "PKW",
      annual: annualEl?.value || "",
      cons: consEl?.value || "",
      fuel: fuelEl?.value || "",
      systemCost: systemCostEl?.value || "250",
      saving: savingEl?.value || "10",
      downPaymentPct: downPaymentEl?.value || "20",
      rentalDuration: rentalDurationEl?.value || "24",
      financeRate: financeRateEl?.value || "5",
    };

    [modeEl, financeModelEl, annualEl, consEl, fuelEl, savingEl, downPaymentEl, rentalDurationEl, financeRateEl]
      .filter(Boolean)
      .forEach((el) => {
        const evt = el.tagName === "SELECT" ? "change" : "input";
        el.addEventListener(evt, rafUpdate, { passive: true });
      });

    vehicleEl?.addEventListener("change", () => {
      rememberedVehicleByMode[getModeKey()] = vehicleEl.value;
      syncVehicleCost();
      rafUpdate();
    });

    modeEl?.addEventListener("change", () => {
      syncLabels();
      syncVehicleOptions();
      syncVehicleCost();
      rafUpdate();
    });

    financeModelEl?.addEventListener("change", () => {
      syncFinanceVisibility();
      rafUpdate();
    });

    btnReset?.addEventListener("click", () => {
      if (modeEl) modeEl.value = defaults.mode;
      if (financeModelEl) financeModelEl.value = defaults.financeModel;
      if (annualEl) annualEl.value = defaults.annual;
      if (consEl) consEl.value = defaults.cons;
      if (fuelEl) fuelEl.value = defaults.fuel;
      if (savingEl) savingEl.value = defaults.saving;
      if (downPaymentEl) downPaymentEl.value = defaults.downPaymentPct;
      if (rentalDurationEl) rentalDurationEl.value = defaults.rentalDuration;
      if (financeRateEl) financeRateEl.value = defaults.financeRate;

      syncStaticTexts();
      syncLabels();
      syncVehicleOptions(true);

      if (vehicleEl && defaults.vehicle) {
        const exists = Array.from(vehicleEl.options).some((o) => o.value === defaults.vehicle);
        if (exists) {
          vehicleEl.value = defaults.vehicle;
          rememberedVehicleByMode[getModeKey()] = vehicleEl.value;
        }
      }

      if (systemCostEl) systemCostEl.value = defaults.systemCost;

      syncVehicleCost();
      syncFinanceVisibility();
      update();
    });

    syncStaticTexts();
    syncLabels();
    syncVehicleOptions(false);
    syncVehicleCost();
    syncFinanceVisibility();
    update();
  });
})();