import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BARS = [
  { name: 'The Horse You Came In On Saloon', neighborhood: 'Fells Point', address: '1626 Thames St', latitude: 39.2822, longitude: -76.5934, vibe: 'Dive Bar', color: '#FF6B35', emoji: '🐴', badge: { name: 'Old Mare', emoji: '🐎', rarity: 'LEGENDARY' as const } },
  { name: "Cat's Eye Pub", neighborhood: 'Fells Point', address: '1730 Thames St', latitude: 39.2825, longitude: -76.5940, vibe: 'Live Music', color: '#7B2FBE', emoji: '🐱', badge: { name: 'Night Cat', emoji: '🎵', rarity: 'RARE' as const } },
  { name: 'Rec Pier Chophouse', neighborhood: 'Fells Point', address: '1715 Thames St', latitude: 39.2831, longitude: -76.5927, vibe: 'Upscale', color: '#FFD700', emoji: '⚓', badge: { name: 'Pier King', emoji: '👑', rarity: 'EPIC' as const } },
  { name: 'Federal Hill Brewing', neighborhood: 'Federal Hill', address: '1219 Light St', latitude: 39.2784, longitude: -76.6077, vibe: 'Brewery', color: '#00C9A7', emoji: '🍺', badge: { name: 'Brew Master', emoji: '🏭', rarity: 'RARE' as const } },
  { name: 'Banditos', neighborhood: 'Federal Hill', address: '1024 Light St', latitude: 39.2779, longitude: -76.6089, vibe: 'Mexican Bar', color: '#FF3366', emoji: '🌮', badge: { name: 'Bandito', emoji: '🤠', rarity: 'COMMON' as const } },
  { name: 'No Way Jose', neighborhood: 'Federal Hill', address: '1039 Light St', latitude: 39.2781, longitude: -76.6092, vibe: 'Cantina', color: '#FF6B35', emoji: '🌵', badge: { name: 'Jose', emoji: '🍹', rarity: 'COMMON' as const } },
  { name: "Moe's Tavern Canton", neighborhood: 'Canton', address: '2400 Boston St', latitude: 39.2809, longitude: -76.5636, vibe: 'Sports Bar', color: '#3B82F6', emoji: '🏈', badge: { name: "Moe's Regular", emoji: '🍻', rarity: 'COMMON' as const } },
  { name: 'The Anchor', neighborhood: 'Canton', address: '2424 Boston St', latitude: 39.2815, longitude: -76.5628, vibe: 'Dive Bar', color: '#4ECDC4', emoji: '⚓', badge: { name: 'Anchor Drop', emoji: '🪝', rarity: 'RARE' as const } },
  { name: 'Power Plant Live', neighborhood: 'Inner Harbor', address: '34 Market Pl', latitude: 39.2865, longitude: -76.6122, vibe: 'Club/Venue', color: '#FFD700', emoji: '⚡', badge: { name: 'Power Surge', emoji: '🔌', rarity: 'LEGENDARY' as const } },
  { name: 'Lure', neighborhood: 'Inner Harbor', address: '100 E Pratt St', latitude: 39.2872, longitude: -76.6134, vibe: 'Rooftop Bar', color: '#8B5CF6', emoji: '🌆', badge: { name: 'Harbor Hawk', emoji: '🦅', rarity: 'EPIC' as const } },
  { name: 'Maximón', neighborhood: 'Mount Vernon', address: '1023 N Charles St', latitude: 39.2972, longitude: -76.6157, vibe: 'Latin Club', color: '#FF3366', emoji: '💃', badge: { name: 'Maximón Spirit', emoji: '🌺', rarity: 'EPIC' as const } },
  { name: "The Brewer's Art", neighborhood: 'Mount Vernon', address: '1106 N Charles St', latitude: 39.2968, longitude: -76.6163, vibe: 'Craft Beer', color: '#7B2FBE', emoji: '🎨', badge: { name: 'Art Collector', emoji: '🖼️', rarity: 'RARE' as const } },
  { name: 'Ottobar', neighborhood: 'Charles Village', address: '2549 N Howard St', latitude: 39.3108, longitude: -76.6195, vibe: 'Indie Rock', color: '#FF3366', emoji: '🎸', badge: { name: 'Indie Spirit', emoji: '🤟', rarity: 'RARE' as const } },
  { name: 'Club Charles', neighborhood: 'Charles Village', address: '1724 N Charles St', latitude: 39.3102, longitude: -76.6188, vibe: 'Dive/Art Bar', color: '#9CA3AF', emoji: '🎭', badge: { name: 'Charles Regular', emoji: '🃏', rarity: 'COMMON' as const } },
  { name: 'Golden West Cafe', neighborhood: 'Hampden', address: '1105 W 36th St', latitude: 39.3285, longitude: -76.6389, vibe: 'Bar/Cafe', color: '#FFD700', emoji: '🌻', badge: { name: 'West Coast', emoji: '🤠', rarity: 'COMMON' as const } },
  { name: 'The Dizz', neighborhood: 'Hampden', address: '1009 W 36th St', latitude: 39.3290, longitude: -76.6381, vibe: 'Neighborhood Bar', color: '#00C9A7', emoji: '🌀', badge: { name: 'The Dizzler', emoji: '😵‍💫', rarity: 'COMMON' as const } },
  { name: 'Union Craft Brewing', neighborhood: 'Medfield', address: '1700 W 41st St', latitude: 39.3201, longitude: -76.6441, vibe: 'Taproom', color: '#FF6B35', emoji: '🏭', badge: { name: 'Union Member', emoji: '🤝', rarity: 'RARE' as const } },
  { name: 'Wet City', neighborhood: 'Mount Vernon', address: '223 W Chase St', latitude: 39.2974, longitude: -76.6144, vibe: 'Craft Beer', color: '#3B82F6', emoji: '💧', badge: { name: 'Wet Badge', emoji: '🌊', rarity: 'RARE' as const } },
  { name: 'Sticky Rice', neighborhood: 'Inner Harbor East', address: '1634 Aliceanna St', latitude: 39.2878, longitude: -76.6015, vibe: 'Asian Fusion Bar', color: '#FF3366', emoji: '🍣', badge: { name: 'Rice Roller', emoji: '🥢', rarity: 'COMMON' as const } },
  { name: 'The Elk Room', neighborhood: 'Downtown', address: '924 N Charles St', latitude: 39.2898, longitude: -76.6145, vibe: 'Speakeasy', color: '#F59E0B', emoji: '🦌', badge: { name: 'Elk Hunter', emoji: '🕵️', rarity: 'LEGENDARY' as const } },
];

async function main() {
  const existing = await prisma.bar.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} bars — skipping seed.`);
    return;
  }

  console.log('Seeding 20 Baltimore bars...');

  for (const barData of BARS) {
    const { badge, ...barFields } = barData;

    const bar = await prisma.bar.create({
      data: {
        ...barFields,
        badgeConfig: badge,
        openHours: { mon: '5pm-2am', tue: '5pm-2am', wed: '5pm-2am', thu: '5pm-2am', fri: '4pm-2am', sat: '12pm-2am', sun: '12pm-2am' },
      },
    });

    await prisma.badge.create({
      data: {
        id: bar.id + '_badge',
        barId: bar.id,
        name: badge.name,
        emoji: badge.emoji,
        rarity: badge.rarity,
        description: `Earned by visiting ${bar.name}`,
      },
    });

    console.log(`✓ ${bar.name}`);
  }

  console.log('✅ Seeded 20 bars with badges');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
