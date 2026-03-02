
import React from 'react';

export const CARD_INTERVALS = { hard: 25, medium: 50, easy: 100 };

export const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <i className={`fa-solid fa-${name} ${className}`}></i>
);

export const COMMON_EMOJIS = [
  // Caras y Emociones
  "😀", "😎", "🤔", "💡", "🚀", "🔥", "⚠️", "✅", "❌", "❤️", "🤩", "🥳", "😱", "😴", "😇", "🤓", "🤯", "🤖", "👽", "👻",
  // Objetos y Trabajo
  "💼", "🎓", "🏠", "💻", "💰", "⏰", "📅", "📝", "📞", "📦", "🛒", "🛠️", "🔑", "📚", "🖊️", "📁", "🗄️", "📏", "✂️", "🔨",
  // Animales y Naturaleza
  "🐶", "🐱", "🦁", "🦊", "🐘", "🐢", "🐧", "🦉", "🦋", "🐝", "🌲", "🍀", "🌍", "🌈", "☀️", "🌙", "⭐", "🌊", "❄️", "🔥",
  // Comida y Bebida
  "🍕", "🍔", "🍎", "🍓", "🍦", "🍫", "☕", "🍺", "🍷", "🍹", "🍱", "🥪", "🍰", "🍩", "🍪", "🍿", "🥗", "🥑", "🥦", "🥨",
  // Actividades y Viajes
  "⚽", "🎵", "🚗", "✈️", "🚢", "🚲", "🎨", "🎭", "🎤", "🎬", "🎸", "🎮", "🏎️", "🏐", "🏀", "⛳", "🧗", "🏃", "🧳", "🗺️",
  // Símbolos
  "➕", "➖", "➗", "✖️", "❓", "❗", "🔄", "♾️", "🆔", "💯", "🔔", "🔇", "📡", "🔋", "🔌", "🛡️", "🔗", "⛓️", "🔭", "🔬"
];
