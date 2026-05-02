/**
 * Namaste Gien — POS System Restaurant Configuration
 * Single source of truth for all POS business settings.
 * French TVA rates applied per loi de finances 2026.
 */

module.exports = {
  restaurant: {
    name: "Namaste Gien",
    street: "2 Pl. du Maréchal Foch",
    city: "Gien",
    postcode: "45500",
    department: "Loiret",
    country: "France",
    countryCode: "FR",
    address: "2 Pl. du Maréchal Foch, 45500 Gien, France",
    phone: "+33751517109",
    phoneDisplay: "+33 7 51 51 71 09",
    email: "contact@namastegien.fr",
    website: "https://www.namastegien.fr",
    timezone: "Europe/Paris",
    currency: "EUR",
    currencySymbol: "€",
    locale: "fr-FR",
    /**
     * French TVA (VAT) rates — Restauration
     * TVA réduit 10%  — nourriture consommée sur place / à emporter
     * TVA normal 20%  — boissons alcoolisées
     * Source: Service-Public.fr / Code Général des Impôts
     */
    vatRates: {
      food: 0.10,      // TVA réduit — nourriture restaurant
      alcohol: 0.20,   // TVA normal — boissons alcoolises / bar
      softDrinks: 0.10, // TVA réduit — boissons non-alcoolisees
      takeaway: 0.10,  // TVA réduit — vente à emporter
    },
    tables: {
      total: 15,
      indoor: 12,
      outdoor: 3,
      capacity: 60,
    },
    printers: {
      kitchen: process.env.KITCHEN_PRINTER_IP || "192.168.1.100",
      bar: process.env.BAR_PRINTER_IP || "192.168.1.101",
      receipt: process.env.RECEIPT_PRINTER_IP || "192.168.1.102",
    },
  },
  pos: {
    sessionTimeout: 3600000, // 1 hour in ms
    currency: "EUR",
    language: "fr",
    receiptHeader: "Namaste Gien\n2 Pl. du Maréchal Foch\n45500 Gien, France\nTél: +33 7 51 51 71 09",
    receiptFooter:
      "Merci de votre visite — Thank you for your visit\nwww.namastegien.fr",
    ticketFooter: "Table service — TVA incluse",
    enableSplitBill: true,
    enableTableTransfer: true,
    enableKitchenDisplay: true,
  },
  socket: {
    port: process.env.SOCKET_PORT || 3001,
    kitchenDisplayPath: "/kitchen",
    barDisplayPath: "/bar",
    managerDisplayPath: "/manager",
  },
  hours: {
    monday: null, // Fermé
    tuesday: { lunch: { open: "12:00", close: "14:30" }, dinner: { open: "18:30", close: "22:30" } },
    wednesday: { lunch: { open: "12:00", close: "14:30" }, dinner: { open: "18:30", close: "22:30" } },
    thursday: { lunch: { open: "12:00", close: "14:30" }, dinner: { open: "18:30", close: "22:30" } },
    friday: { lunch: { open: "12:00", close: "14:30" }, dinner: { open: "18:30", close: "22:30" } },
    saturday: { lunch: { open: "12:00", close: "15:00" }, dinner: { open: "18:30", close: "23:00" } },
    sunday: { lunch: { open: "12:00", close: "15:00" }, dinner: { open: "18:30", close: "22:00" } },
  },
};
