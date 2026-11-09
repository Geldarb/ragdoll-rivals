// Key poses matching Bradley's painted reference language.
// Numbers are in pixels relative to the shoulder for hands.
const H = 32;

export function idle() {
  return {
    name: 'Idle', action: 'idle', lean: 0.04, hipDrop: 0.14, stanceWidth: 1.12, weight: 0.06,
    heelLift: 1, weaponAngle: 2.58,
    footLead: { offset: 0.40, lift: 0 }, footRear: { offset: -0.50, lift: 0 },
    hands: { lead: { x: H * 0.9, y: H * 1.72 }, rear: { x: H * 0.78, y: H * 0.55 } }
  };
}

export function walkFrame(i, n = 6) {
  const phase = i / n;
  const lead = Math.sin(phase * Math.PI * 2);
  const liftL = Math.max(0, Math.cos(phase * Math.PI * 2)) * 12;
  const liftR = Math.max(0, -Math.cos(phase * Math.PI * 2)) * 12;
  return {
    name: `Walk ${i + 1}`, action: 'walk', lean: 0.08 + lead * 0.03, hipDrop: 0.18,
    stanceWidth: 1.18, weight: lead * 0.22, weaponAngle: 2.28 + lead * 0.08,
    hipBob: Math.abs(Math.cos(phase * Math.PI * 2)) * 2,
    footLead: { offset: lead * 0.88, lift: liftL },
    footRear: { offset: -lead * 0.88, lift: liftR },
    hands: {
      lead: { x: H * (0.85 + lead * 0.2), y: H * (1.55 - lead * 0.1) },
      rear: { x: H * 0.7, y: H * (0.5 + lead * 0.08) }
    }
  };
}

export function runFrame(i, n = 6) {
  const phase = i / n;
  const lead = Math.sin(phase * Math.PI * 2);
  const liftL = Math.max(0, Math.cos(phase * Math.PI * 2)) * 22;
  const liftR = Math.max(0, -Math.cos(phase * Math.PI * 2)) * 22;
  return {
    name: `Run ${i + 1}`, action: 'run', lean: 0.28 + lead * 0.04, hipDrop: 0.16,
    stanceWidth: 1.35, weight: lead * 0.3, weaponAngle: 2.05 + lead * 0.18,
    hipBob: Math.abs(Math.cos(phase * Math.PI * 2)) * 3.2,
    heelLift: 2,
    footLead: { offset: lead * 0.98, lift: liftL },
    footRear: { offset: -lead * 0.98, lift: liftR },
    hands: {
      lead: { x: H * (0.35 + lead * 0.85), y: H * (0.55 - lead * 0.85) },
      rear: { x: H * (-0.15 - lead * 0.35), y: H * (0.35 + lead * 0.45) }
    }
  };
}

export function lunge() {
  return {
    name: 'Lunge', action: 'lunge', lean: 0.32, hipDrop: 0.22, stanceWidth: 1.85, weight: 0.42,
    weaponAngle: 1.42,
    footLead: { offset: 0.88, lift: 0 }, footRear: { offset: -0.82, lift: 0 },
    hands: { lead: { x: H * 2.35, y: H * 0.15 }, rear: { x: H * 0.95, y: H * 0.35 } }
  };
}

export function overheadRaise() {
  return {
    name: 'Overhead raise', action: 'overheadRaise', lean: -0.08, hipDrop: 0.28, stanceWidth: 1.15, weight: -0.16,
    weaponAngle: -1.05,
    footLead: { offset: 0.32, lift: 0 }, footRear: { offset: -0.55, lift: 0 },
    hands: { lead: { x: -H * 0.25, y: -H * 2.15 }, rear: { x: -H * 0.05, y: -H * 1.55 } },
    twoHand: true
  };
}

export function overheadChop() {
  return {
    name: 'Overhead chop', action: 'overheadChop', lean: 0.22, hipDrop: 0.26, stanceWidth: 1.28, weight: 0.28,
    weaponAngle: 1.72,
    footLead: { offset: 0.55, lift: 0 }, footRear: { offset: -0.52, lift: 0 },
    hands: { lead: { x: H * 1.45, y: H * 0.72 }, rear: { x: H * 0.75, y: H * 0.28 } },
    twoHand: true
  };
}

export function slash() {
  return {
    name: 'Horizontal slash', action: 'slash', lean: 0.16, hipDrop: 0.2, stanceWidth: 1.32, weight: 0.26,
    weaponAngle: 1.62, trail: true,
    footLead: { offset: 0.5, lift: 0 }, footRear: { offset: -0.58, lift: 0 },
    hands: { lead: { x: H * 2.15, y: H * 0.08 }, rear: { x: H * 0.55, y: H * 0.25 } }
  };
}

export function thrust() {
  return {
    name: 'Thrust', action: 'thrust', lean: 0.18, hipDrop: 0.16, stanceWidth: 1.48, weight: 0.28,
    weaponAngle: 1.38,
    footLead: { offset: 0.7, lift: 0 }, footRear: { offset: -0.62, lift: 0 },
    hands: { lead: { x: H * 2.4, y: H * -0.02 }, rear: { x: H * 1.35, y: H * 0.08 } }
  };
}

export function crouch() {
  return {
    name: 'Crouch', action: 'crouch', lean: 0.08, hipDrop: 0.58, stanceWidth: 1.35, weight: 0.1,
    weaponAngle: 2.15,
    footLead: { offset: 0.55, lift: 0 }, footRear: { offset: -0.52, lift: 0 },
    hands: { lead: { x: H * 0.85, y: H * 1.35 }, rear: { x: H * 0.75, y: H * 0.85 } }
  };
}

export function kneel() {
  return {
    name: 'Kneel', action: 'kneel', lean: 0.05, hipDrop: 0.88, stanceWidth: 1.22, weight: 0.02,
    weaponAngle: 2.48,
    footLead: { offset: 0.74, lift: 0 }, footRear: { offset: -0.5, lift: 0 },
    hands: { lead: { x: H * 0.55, y: H * 1.45 }, rear: { x: H * 0.5, y: H * 0.55 } }
  };
}

export function getUp() {
  return {
    name: 'Get-up', action: 'getup', lean: 0.44, hipDrop: 0.74, stanceWidth: 1.42, weight: 0.2,
    weaponAngle: 2.2,
    footLead: { offset: 0.78, lift: 0 }, footRear: { offset: -0.22, lift: 0 },
    hands: { lead: { x: H * 0.95, y: H * 1.15 }, rear: { x: H * 0.2, y: H * 2.2 } }
  };
}

export function shieldGuard() {
  return {
    name: 'Shield guard', action: 'guard', lean: -0.04, hipDrop: 0.22, stanceWidth: 1.22, weight: -0.1,
    weaponAngle: 0.85,
    footLead: { offset: 0.42, lift: 0 }, footRear: { offset: -0.55, lift: 0 },
    hands: { lead: { x: H * 1.05, y: H * 0.15 }, rear: { x: H * 1.05, y: H * -0.35 } }
  };
}

export function groundStrike() {
  return {
    name: 'Ground strike', action: 'groundStrike', lean: 0.38, hipDrop: 0.4, stanceWidth: 1.42, weight: 0.36,
    weaponAngle: 2.72, debris: true,
    footLead: { offset: 0.58, lift: 0 }, footRear: { offset: -0.6, lift: 0 },
    hands: { lead: { x: H * 1.25, y: H * 2.45 }, rear: { x: H * 0.5, y: H * 1.55 } }
  };
}

// 24-pose layout hypothesis (6 x 4), to be remapped after seeing the painted sheet.
export const MAIN_SHEET = [
  idle(), walkFrame(0), walkFrame(1), walkFrame(2), walkFrame(3), walkFrame(4),
  walkFrame(5), runFrame(0), runFrame(1), runFrame(2), runFrame(3), runFrame(4),
  runFrame(5), lunge(), overheadRaise(), overheadChop(), slash(), thrust(),
  crouch(), kneel(), getUp(), shieldGuard(), groundStrike(), idle()
];

export const COMPARE_POSES = [
  idle(), walkFrame(2), runFrame(2), lunge(),
  overheadRaise(), overheadChop(), slash(), thrust(),
  crouch(), kneel(), getUp(), shieldGuard(), groundStrike()
];

export const DEFAULT_BUILD = {
  armour: 'plate', helmet: 'great', shield: 'heater', weapon: 'sword',
  cloth: '#6b2a2a', trim: '#c9a24a', crest: true
};
