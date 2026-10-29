/** Identificadores de los iconos SVG del menú del shell. */
export type ShellIcon = 'home' | 'chart' | 'box' | 'orders' | 'help';

/** Trazados SVG de los iconos del menú del shell. */
export const SHELL_ICONS: Readonly<Record<ShellIcon, string>> = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  box: 'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10',
  orders: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  help: 'M12 21a9 9 0 110-18 9 9 0 010 18zM9.1 9a3 3 0 115.5 1.6c-.8 1-2.6 1.5-2.6 3.4M12 18h.01',
};
