/**
 * EventBus
 *
 * Simple event emitter for game events. Allows decoupled communication
 * between the game engine and UI components.
 */

import type { GameEvent, GameEventType, EventListener, Unsubscribe } from './types/events';

/**
 * EventBus implementation for game events
 */
export class EventBus {
  private listeners: Map<GameEventType, Set<EventListener>> = new Map();
  private allListeners: Set<EventListener> = new Set();

  /**
   * Subscribe to a specific event type
   *
   * @param type - Event type to listen for
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  on<T extends GameEvent>(type: GameEventType, listener: EventListener<T>): Unsubscribe {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const typedListener = listener as EventListener;
    this.listeners.get(type)!.add(typedListener);

    return () => {
      this.off(type, listener);
    };
  }

  /**
   * Subscribe to all events (useful for logging/debugging)
   *
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  onAny(listener: EventListener): Unsubscribe {
    this.allListeners.add(listener);

    return () => {
      this.allListeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from a specific event type
   *
   * @param type - Event type
   * @param listener - Callback function to remove
   */
  off<T extends GameEvent>(type: GameEventType, listener: EventListener<T>): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener as EventListener);

      // Clean up empty listener sets
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Emit an event to all listeners
   *
   * @param event - Event to emit
   */
  emit(event: GameEvent): void {
    // Call type-specific listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }

    // Call global listeners
    this.allListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in global event listener for ${event.type}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for a specific type, or all listeners if no type specified
   *
   * @param type - Optional event type to clear
   */
  removeAllListeners(type?: GameEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
      this.allListeners.clear();
    }
  }

  /**
   * Get count of listeners for a specific type
   *
   * @param type - Event type
   * @returns Number of listeners
   */
  listenerCount(type: GameEventType): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  /**
   * Check if there are any listeners for a specific type
   *
   * @param type - Event type
   * @returns True if listeners exist
   */
  hasListeners(type: GameEventType): boolean {
    return this.listenerCount(type) > 0;
  }

  /**
   * Get all registered event types
   *
   * @returns Array of event types that have listeners
   */
  getEventTypes(): GameEventType[] {
    return Array.from(this.listeners.keys());
  }
}

/**
 * Create a new EventBus instance
 */
export function createEventBus(): EventBus {
  return new EventBus();
}

/**
 * Singleton event bus for global use (optional)
 */
let globalEventBus: EventBus | null = null;

/**
 * Get or create the global event bus
 */
export function getGlobalEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

/**
 * Reset the global event bus (useful for testing)
 */
export function resetGlobalEventBus(): void {
  if (globalEventBus) {
    globalEventBus.removeAllListeners();
  }
  globalEventBus = null;
}
