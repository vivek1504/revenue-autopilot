import { Customer } from '../shared/types';

const FIRST_NAMES = [
  'Ananya', 'Rahul', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Neha', 'Arjun',
  'Pooja', 'Aditya', 'Kavya', 'Siddharth', 'Divya', 'Karan', 'Riya', 'Aman',
  'Meera', 'Varun', 'Tanvi', 'Ishaan', 'Shreya', 'Yash', 'Anushka', 'Dev',
  'Tara', 'Kabir', 'Zoya', 'Nikhil', 'Rhea', 'Aarav', 'Diya', 'Vihaan',
  'Sanya', 'Reyansh', 'Kiara', 'Vivaan', 'Myra', 'Atharv', 'Anaya', 'Kian',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Mehta', 'Singh', 'Kumar', 'Reddy',
  'Rao', 'Joshi', 'Nair', 'Shah', 'Iyer', 'Agarwal', 'Chopra', 'Malhotra',
  'Bhasin', 'Kapoor', 'Deshmukh', 'Kulkarni', 'Bhatt', 'Trivedi', 'Saxena', 'Dutta',
];

export interface CustomerWithScenario extends Customer {
  scenario:
    | 'abandoned_checkout'
    | 'failed_payment'
    | 'upsell'
    | 're_engagement'
    | 'recent_buyer'
    | 'low_value'
    | 'vip'
    | 'high_value'
    | 'edge_case';
}

export function generateCustomers(count: number = 120): CustomerWithScenario[] {
  const customers: CustomerWithScenario[] = [];
  
  // Scenario allocations for 120 total:
  // 1 - 30: abandoned_checkout
  // 31 - 50: failed_payment
  // 51 - 65: upsell
  // 66 - 80: re_engagement
  // 81 - 90: recent_buyer
  // 91 - 100: low_value
  // 101 - 110: vip
  // 111 - 115: high_value
  // 116 - 120: edge_case

  for (let i = 1; i <= count; i++) {
    const id = `cust_${String(i).padStart(3, '0')}`;
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const phone = `+9198${String(10000000 + i * 373).slice(0, 8)}`;

    let scenario: CustomerWithScenario['scenario'];
    let tier: Customer['tier'] = 'standard';
    let lifetimeSpendPaise = 0;
    let totalOrders = 0;
    let notes: string | undefined;

    if (i <= 30) {
      scenario = 'abandoned_checkout';
      totalOrders = Math.floor(Math.random() * 5) + 1;
      lifetimeSpendPaise = totalOrders * (Math.floor(Math.random() * 3000) + 1500) * 100;
    } else if (i <= 50) {
      scenario = 'failed_payment';
      totalOrders = Math.floor(Math.random() * 6) + 2;
      lifetimeSpendPaise = totalOrders * (Math.floor(Math.random() * 4000) + 2000) * 100;
    } else if (i <= 65) {
      scenario = 'upsell';
      tier = 'premium';
      totalOrders = Math.floor(Math.random() * 5) + 4;
      lifetimeSpendPaise = totalOrders * (Math.floor(Math.random() * 5000) + 3000) * 100;
    } else if (i <= 80) {
      scenario = 're_engagement';
      totalOrders = Math.floor(Math.random() * 4) + 2;
      lifetimeSpendPaise = totalOrders * (Math.floor(Math.random() * 2500) + 1500) * 100;
    } else if (i <= 90) {
      scenario = 'recent_buyer';
      totalOrders = Math.floor(Math.random() * 3) + 1;
      lifetimeSpendPaise = totalOrders * (Math.floor(Math.random() * 2000) + 1000) * 100;
    } else if (i <= 100) {
      scenario = 'low_value';
      totalOrders = 1;
      lifetimeSpendPaise = (Math.floor(Math.random() * 800) + 300) * 100; // < ₹1,000
    } else if (i <= 110) {
      scenario = 'vip';
      tier = 'vip';
      totalOrders = Math.floor(Math.random() * 10) + 8;
      lifetimeSpendPaise = (Math.floor(Math.random() * 30000) + 50000) * 100; // ₹50,000+
    } else if (i <= 115) {
      scenario = 'high_value';
      tier = 'premium';
      totalOrders = 5;
      lifetimeSpendPaise = 3500000; // ₹35,000
    } else {
      scenario = 'edge_case';
      totalOrders = 0;
      lifetimeSpendPaise = 0;
    }

    const now = new Date();
    const firstPurchaseDaysAgo = totalOrders > 0 ? 30 + totalOrders * 15 : 0;
    const lastPurchaseDaysAgo = scenario === 're_engagement' ? 45 : scenario === 'recent_buyer' ? 2 : 12;

    const firstPurchaseDate = totalOrders > 0
      ? new Date(now.getTime() - firstPurchaseDaysAgo * 86400000).toISOString()
      : undefined;

    const lastPurchaseDate = totalOrders > 0
      ? new Date(now.getTime() - lastPurchaseDaysAgo * 86400000).toISOString()
      : undefined;

    customers.push({
      id,
      name,
      email,
      phone,
      tier,
      lifetime_spend_paise: lifetimeSpendPaise,
      total_orders: totalOrders,
      first_purchase_date: firstPurchaseDate,
      last_purchase_date: lastPurchaseDate,
      notes,
      created_at: firstPurchaseDate || now.toISOString(),
      scenario,
    });
  }

  return customers;
}
