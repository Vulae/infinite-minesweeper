
import type { World } from "$lib/game/World";
import { writable, type Writable } from "svelte/store";



export const volume = writable(0.25);

export const world: Writable<World | null> = writable(null);


