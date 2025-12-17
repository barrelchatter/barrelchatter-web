/**
 * Constants for bottle condition, flavors, and wishlist options
 * Migration 012: Enhanced Tracking & Social Features
 */

// Fill level options for open bottles
export const FILL_LEVELS = [
  { value: 'full', label: 'Full', percent: 100 },
  { value: '90%', label: '90%', percent: 90 },
  { value: '75%', label: '75%', percent: 75 },
  { value: '50%', label: '50%', percent: 50 },
  { value: '25%', label: '25%', percent: 25 },
  { value: 'empty', label: 'Empty', percent: 0 },
];

// Seal condition for collectors
export const SEAL_CONDITIONS = [
  { value: 'intact', label: 'Intact', color: 'green' },
  { value: 'broken', label: 'Broken', color: 'orange' },
  { value: 'missing', label: 'Missing', color: 'red' },
];

// Label condition
export const LABEL_CONDITIONS = [
  { value: 'mint', label: 'Mint', color: 'green' },
  { value: 'good', label: 'Good', color: 'blue' },
  { value: 'worn', label: 'Worn', color: 'orange' },
  { value: 'damaged', label: 'Damaged', color: 'red' },
];

// Box condition (if included)
export const BOX_CONDITIONS = [
  { value: 'mint', label: 'Mint', color: 'green' },
  { value: 'good', label: 'Good', color: 'blue' },
  { value: 'worn', label: 'Worn', color: 'orange' },
  { value: 'damaged', label: 'Damaged', color: 'red' },
];

// Inventory lifecycle event types
export const EVENT_TYPES = [
  { value: 'purchased', label: 'Purchased', icon: '🛒' },
  { value: 'opened', label: 'Opened', icon: '🍾' },
  { value: 'shared', label: 'Shared', icon: '🥃' },
  { value: 'finished', label: 'Finished', icon: '✅' },
  { value: 'traded', label: 'Traded', icon: '🔄' },
  { value: 'gifted', label: 'Gifted', icon: '🎁' },
  { value: 'damaged', label: 'Damaged', icon: '💔' },
  { value: 'resealed', label: 'Resealed', icon: '🔒' },
  { value: 'other', label: 'Other', icon: '📝' },
];

// Visibility options
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: '🔒', description: 'Only you can see' },
  { value: 'friends', label: 'Friends', icon: '👥', description: 'Visible to friends' },
  { value: 'public', label: 'Public', icon: '🌍', description: 'Anyone can see' },
];

// Wishlist priority levels
export const WISHLIST_PRIORITIES = [
  { value: 1, label: 'Must Have', color: '#ef4444', stars: 5 },
  { value: 2, label: 'High Priority', color: '#f97316', stars: 4 },
  { value: 3, label: 'Medium', color: '#eab308', stars: 3 },
  { value: 4, label: 'Low Priority', color: '#3b82f6', stars: 2 },
  { value: 5, label: 'Nice to Have', color: '#6b7280', stars: 1 },
];

// Wishlist status
export const WISHLIST_STATUSES = [
  { value: 'active', label: 'Hunting', color: 'blue' },
  { value: 'found', label: 'Found!', color: 'green' },
  { value: 'purchased', label: 'Purchased', color: 'purple' },
  { value: 'abandoned', label: 'Abandoned', color: 'gray' },
];

// Common bourbon flavor descriptors
export const COMMON_FLAVORS = [
  // Sweet
  'vanilla',
  'caramel',
  'toffee',
  'honey',
  'brown sugar',
  'maple',
  'butterscotch',
  'molasses',
  
  // Fruit
  'cherry',
  'apple',
  'orange',
  'dried fruit',
  'raisin',
  'banana',
  'peach',
  'apricot',
  'dark fruit',
  
  // Spice
  'cinnamon',
  'nutmeg',
  'pepper',
  'black pepper',
  'clove',
  'ginger',
  'allspice',
  'baking spice',
  
  // Wood
  'oak',
  'charred oak',
  'toasted wood',
  'cedar',
  'pine',
  'sawdust',
  
  // Grain
  'corn',
  'rye',
  'wheat',
  'grain',
  'biscuit',
  'bread',
  
  // Nutty
  'almond',
  'walnut',
  'pecan',
  'peanut',
  
  // Other
  'leather',
  'tobacco',
  'smoke',
  'char',
  'coffee',
  'chocolate',
  'cocoa',
  'mint',
  'eucalyptus',
  'floral',
  'herbal',
];

// Flavor categories for grouping in UI
export const FLAVOR_CATEGORIES = {
  sweet: ['vanilla', 'caramel', 'toffee', 'honey', 'brown sugar', 'maple', 'butterscotch', 'molasses'],
  fruit: ['cherry', 'apple', 'orange', 'dried fruit', 'raisin', 'banana', 'peach', 'apricot', 'dark fruit'],
  spice: ['cinnamon', 'nutmeg', 'pepper', 'black pepper', 'clove', 'ginger', 'allspice', 'baking spice'],
  wood: ['oak', 'charred oak', 'toasted wood', 'cedar', 'pine', 'sawdust'],
  grain: ['corn', 'rye', 'wheat', 'grain', 'biscuit', 'bread'],
  nutty: ['almond', 'walnut', 'pecan', 'peanut'],
  other: ['leather', 'tobacco', 'smoke', 'char', 'coffee', 'chocolate', 'cocoa', 'mint', 'eucalyptus', 'floral', 'herbal'],
};

// Sighting quantity options
export const SIGHTING_QUANTITIES = [
  { value: 'plenty', label: 'Plenty in Stock', color: 'green' },
  { value: 'limited', label: 'Limited Stock', color: 'yellow' },
  { value: 'few_left', label: 'Few Left', color: 'orange' },
  { value: 'last_bottle', label: 'Last Bottle!', color: 'red' },
];

// Helper functions
export function getFillLevelPercent(value) {
  const level = FILL_LEVELS.find(l => l.value === value);
  return level ? level.percent : 100;
}

export function getConditionColor(condition, type = 'label') {
  const options = type === 'seal' ? SEAL_CONDITIONS : 
                  type === 'box' ? BOX_CONDITIONS : LABEL_CONDITIONS;
  const found = options.find(o => o.value === condition);
  return found ? found.color : 'gray';
}

export function getPriorityInfo(priority) {
  return WISHLIST_PRIORITIES.find(p => p.value === priority) || WISHLIST_PRIORITIES[2];
}

export function getEventIcon(eventType) {
  const event = EVENT_TYPES.find(e => e.value === eventType);
  return event ? event.icon : '📝';
}
