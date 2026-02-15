import crypto from "crypto";

const YANDEX_API_BASE = "https://b2b.taxi.yandex.net/b2b/cargo/integration/v2";

function getToken(): string {
  return process.env.YANDEX_DELIVERY_TOKEN || "";
}

interface RoutePoint {
  point_id: number;
  visit_order: number;
  contact: { name: string; phone: string };
  address: {
    fullname: string;
    coordinates: [number, number];
  };
  type?: string;
  skip_confirmation?: boolean;
}

interface DeliveryItem {
  extra_id: string;
  pickup_point: number;
  dropoff_point: number;
  title: string;
  size: { length: number; width: number; height: number };
  weight: number;
  cost_value: string;
  cost_currency: string;
  quantity: number;
}

interface CreateClaimParams {
  pickupAddress: string;
  pickupCoordinates: [number, number];
  pickupContact: { name: string; phone: string };
  dropoffAddress: string;
  dropoffCoordinates?: [number, number];
  dropoffContact: { name: string; phone: string };
  items: { title: string; quantity: number; cost: number }[];
  comment?: string;
}

interface ClaimResponse {
  id: string;
  status: string;
  version: number;
  pricing?: {
    offer?: {
      price: string;
      currency: string;
    };
    final_price?: string;
  };
  error_messages?: { code: string; message: string }[];
}

async function yandexRequest(method: string, path: string, body?: any, queryParams?: Record<string, string>): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("Yandex Delivery token not configured");

  let url = `${YANDEX_API_BASE}${path}`;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept-Language": "ru",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`Yandex API error (${response.status}): ${errMsg}`);
  }

  return data;
}

export async function estimateDelivery(params: {
  pickupAddress: string;
  pickupCoordinates: [number, number];
  pickupContact: { name: string; phone: string };
  dropoffAddress: string;
  dropoffContact: { name: string; phone: string };
  totalCost: number;
}): Promise<{ claimId: string; price: number; currency: string; status: string }> {
  const requestId = crypto.randomUUID();

  const body = {
    client_requirements: {
      taxi_class: "express",
    },
    items: [
      {
        extra_id: "order-items",
        pickup_point: 1,
        dropoff_point: 2,
        title: "Заказ",
        size: { length: 0.3, width: 0.3, height: 0.3 },
        weight: 3,
        cost_value: String(params.totalCost),
        cost_currency: "KZT",
        quantity: 1,
      },
    ],
    route_points: [
      {
        point_id: 1,
        visit_order: 1,
        contact: params.pickupContact,
        address: {
          fullname: params.pickupAddress,
          coordinates: params.pickupCoordinates,
        },
        type: "source",
        skip_confirmation: false,
      },
      {
        point_id: 2,
        visit_order: 2,
        contact: params.dropoffContact,
        address: {
          fullname: params.dropoffAddress,
          coordinates: [0, 0],
        },
        type: "destination",
        skip_confirmation: false,
      },
    ],
    skip_act: true,
    optional_return: false,
  };

  const result = await yandexRequest("POST", "/claims/create", body, { request_id: requestId });

  let price = 0;
  if (result.pricing?.offer?.price) {
    price = Math.round(parseFloat(result.pricing.offer.price));
  } else if (result.pricing?.final_price) {
    price = Math.round(parseFloat(result.pricing.final_price));
  }

  return {
    claimId: result.id,
    price,
    currency: result.pricing?.offer?.currency || "KZT",
    status: result.status,
  };
}

export async function getClaimInfo(claimId: string): Promise<ClaimResponse> {
  return yandexRequest("POST", "/claims/info", {}, { claim_id: claimId });
}

export async function acceptClaim(claimId: string, version: number): Promise<ClaimResponse> {
  return yandexRequest("POST", "/claims/accept", { version }, { claim_id: claimId });
}

export async function cancelClaim(claimId: string, cancelState: string = "free", version: number = 1): Promise<ClaimResponse> {
  return yandexRequest("POST", "/claims/cancel", {
    cancel_state: cancelState,
    version,
  }, { claim_id: claimId });
}

export async function checkDeliveryAvailability(): Promise<boolean> {
  const token = getToken();
  return !!token;
}
