/**
 * Centralized constants for the Sparkle cleaning service application
 *
 * IMPORTANT: All service IDs and names should be referenced from this file
 * to maintain consistency across the application.
 */

export interface Service {
  id: string;
  name: string;
  description: string;
  durationHours: 2 | 6;
}

export interface ServiceBasic {
  id: string;
  name: string;
}

/**
 * All available cleaning services
 *
 * Service IDs follow the pattern: lowercase-with-dashes
 * These IDs are used in:
 * - Firestore cleaner.services array
 * - URL parameters
 * - Service filtering queries
 */
export const SERVICES: Service[] = [
  {
    id: "simple-clean",
    name: "Simple Clean",
    description: "Quick, efficient cleaning for your everyday needs",
    durationHours: 2,
  },
  {
    id: "deep-clean",
    name: "Deep Clean",
    description: "Thorough cleaning for every corner of your space",
    durationHours: 6,
  },
  {
    id: "move-out-clean",
    name: "Move-Out Clean",
    description: "Complete cleaning for moving transitions",
    durationHours: 2,
  },
  {
    id: "office-clean",
    name: "Office Clean",
    description: "Professional cleaning for workspaces",
    durationHours: 6,
  },
  {
    id: "window-cleaning",
    name: "Window Cleaning",
    description: "Crystal clear windows inside and out",
    durationHours: 2,
  },
  {
    id: "carpet-cleaning",
    name: "Carpet Cleaning",
    description: "Deep carpet and upholstery cleaning",
    durationHours: 6,
  },
  {
    id: "post-construction",
    name: "Post-Construction",
    description: "Cleanup after renovations and construction",
    durationHours: 2,
  },
  {
    id: "laundry-service",
    name: "Laundry Service",
    description: "Wash, fold, and organize your laundry",
    durationHours: 2,
  },
];

/**
 * Simplified service list (ID and name only)
 * Used in forms and dropdowns
 */
export const SERVICES_BASIC: ServiceBasic[] = SERVICES.map(({ id, name }) => ({ id, name }));

/**
 * Get service by ID
 */
export const getServiceById = (id: string): Service | undefined => {
  return SERVICES.find(service => service.id === id);
};

/**
 * Get service name by ID
 */
export const getServiceName = (id: string): string => {
  return getServiceById(id)?.name || id;
};

/**
 * Maximum number of days to search for availability
 */
export const MAX_SEARCH_DAYS = 90;

/**
 * Default cleaner image
 */
export const DEFAULT_CLEANER_IMAGE = "/images/default-cleaner.png";

/**
 * Price multipliers for service types
 * (Used in booking calculations)
 */
export const PRICE_MULTIPLIERS: Record<string, number> = {
  "simple-clean": 1,
  "deep-clean": 2,
  "move-out-clean": 1,
  "office-clean": 2,
  "window-cleaning": 1,
  "carpet-cleaning": 2,
  "post-construction": 1,
  "laundry-service": 1,
};
