import { useQuery } from "@tanstack/react-query";
import { getBusinessLabels, type Store } from "@shared/schema";

export function useBusinessLabels() {
  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  return getBusinessLabels(store?.businessType);
}
