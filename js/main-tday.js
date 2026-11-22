// Entry point for tday.html: install the Thanksgiving theme, then load the shared game.
import { setTheme } from './theme.js';
import { tdayTheme } from './themes/tday.js';

setTheme(tdayTheme);
await import('./main.js');
