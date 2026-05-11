export interface Courier {
  courier_id: string;
  courier_name: string;
  courier_image: string;
  service_code: string;
  service_type: "pickup" | "dropoff";
  ratings: number;
  rate_card_amount: number;
  currency: string;
  pickup_eta: string;
  delivery_eta: string;
  tracking: { bars: number; label: string };
  driver_name: string;
  driver_phone: string;
}

export const mockCouriers: Courier[] = [
  {
    courier_id: "dhl", courier_name: "DHL Express", courier_image: "",
    service_code: "dhl", service_type: "pickup", ratings: 5,
    rate_card_amount: 25.99, currency: "USD", pickup_eta: "Within 3 hours",
    delivery_eta: "1-3 business days", tracking: { bars: 5, label: "Excellent" },
    driver_name: "James Okoro", driver_phone: "+1234500001",
  },
  {
    courier_id: "fedex", courier_name: "FedEx International", courier_image: "",
    service_code: "fedex", service_type: "pickup", ratings: 4,
    rate_card_amount: 22.50, currency: "USD", pickup_eta: "Within 6 hours",
    delivery_eta: "2-5 business days", tracking: { bars: 4, label: "Good" },
    driver_name: "Sarah Chen", driver_phone: "+1234500002",
  },
  {
    courier_id: "ups", courier_name: "UPS Standard", courier_image: "",
    service_code: "ups", service_type: "dropoff", ratings: 4,
    rate_card_amount: 18.75, currency: "USD", pickup_eta: "Within 1 day",
    delivery_eta: "3-7 business days", tracking: { bars: 3, label: "Average" },
    driver_name: "Mike Rivera", driver_phone: "+1234500003",
  },
  {
    courier_id: "aramex", courier_name: "Aramex Express", courier_image: "",
    service_code: "aramex", service_type: "pickup", ratings: 3,
    rate_card_amount: 15.00, currency: "USD", pickup_eta: "Within 1 day",
    delivery_eta: "4-8 business days", tracking: { bars: 3, label: "Average" },
    driver_name: "Fatima Al-Rashid", driver_phone: "+1234500004",
  },
  {
    courier_id: "gig", courier_name: "GIG Logistics", courier_image: "",
    service_code: "gig", service_type: "pickup", ratings: 4,
    rate_card_amount: 12.30, currency: "USD", pickup_eta: "Within 4 hours",
    delivery_eta: "1-2 business days", tracking: { bars: 4, label: "Good" },
    driver_name: "Chidi Nwosu", driver_phone: "+1234500005",
  },
  {
    courier_id: "kwik", courier_name: "Kwik Delivery", courier_image: "",
    service_code: "kwik", service_type: "pickup", ratings: 3,
    rate_card_amount: 8.99, currency: "USD", pickup_eta: "Within 2 hours",
    delivery_eta: "Same day", tracking: { bars: 3, label: "Average" },
    driver_name: "Tunde Bakare", driver_phone: "+1234500006",
  },
];
