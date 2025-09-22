// Browser compatibility layer - don't redeclare if browser already exists
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Keep track of Firefox environment
const isFirefox = (typeof browser !== 'undefined' && browser.runtime.getURL('').startsWith('moz-extension://'));

console.log(`Tab Snoozer background script starting (Firefox: ${isFirefox})`);

// Function to reopen tabs and clean up expired entries
// Lock to prevent concurrent execution
let isCheckingTabs = false;

async function checkForSnoozedTabs() {
  if (isCheckingTabs) {
    console.log("checkForSnoozedTabs is already running. Skipping execution.");
    return;
  }

  isCheckingTabs = true; // Set the lock

  try {
    const now = Date.now();
    const items = await browser.storage.local.get(null); // Get all stored items

    for (const [key, value] of Object.entries(items)) {
      if (value.snoozeTime && value.snoozeTime <= now) {
        if (value.processing) {
          // Skip entries already being processed
          console.log(`Skipping ${key}, already processing.`);
          continue;
        }

        // Mark as processing to avoid duplicates
        value.processing = true;
        await browser.storage.local.set({ [key]: value });

        // Reopen the tab
        try {
          await browser.tabs.create({ url: value.url });
          console.log(`Reopened tab: ${value.url}`);

          // Show notification
          const notificationId = `wake-${Date.now()}`;
          browser.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Tab Woke Up!',
            message: value.title || value.url,
            priority: 1
          });

          // Auto-dismiss notification after 5 seconds
          setTimeout(() => {
            browser.notifications.clear(notificationId);
          }, 5000);

          // Handle recurring snoozes
          if (value.recurringId) {
            const recurringConfig = items[value.recurringId];
            if (recurringConfig) {
              // Calculate next occurrence
              const [hours, minutes] = recurringConfig.time.split(":").map(Number);
              const nextTime = getNextOccurrence(hours, minutes, recurringConfig.days);
              const newAlarmName = `snooze-${Date.now()}-${nextTime.getTime()}`;

              // Create next occurrence
              await browser.storage.local.set({
                [newAlarmName]: {
                  url: value.url,
                  title: value.title,
                  snoozeTime: nextTime.getTime(),
                  recurringId: value.recurringId
                }
              });

              browser.alarms.create(newAlarmName, { when: nextTime.getTime() });
              console.log(`Created next recurring snooze for: ${value.url}`);

              // Notify about next recurring snooze
              const nextNotificationId = `recurring-${Date.now()}`;
              browser.notifications.create(nextNotificationId, {
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Recurring Tab - Next Snooze Set',
                message: `Tab will reopen next on ${nextTime.toLocaleString()}`,
                priority: 0
              });

              setTimeout(() => {
                browser.notifications.clear(nextNotificationId);
              }, 5000);
            }
          }

          // Remove the current entry from storage
          await browser.storage.local.remove(key);
          console.log(`Cleared snooze entry: ${key}`);
        } catch (error) {
          console.error(`Failed to reopen tab for ${key}:`, error);

          // Cleanup processing flag in case of failure
          value.processing = false;
          await browser.storage.local.set({ [key]: value });
        }
      }
    }
  } catch (error) {
    console.error("Error in checkForSnoozedTabs:", error);
  } finally {
    isCheckingTabs = false; // Release the lock
  }
}

// Helper function to get next occurrence for recurring snooze
function getNextOccurrence(hours, minutes, selectedDays) {
  const now = new Date();
  const result = new Date();
  result.setHours(hours, minutes, 0, 0);

  if (result <= now) {
    result.setDate(result.getDate() + 1);
  }

  while (!selectedDays.includes(result.getDay())) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

// Recreate alarms from storage (for Firefox restart persistence)
async function recreateAlarmsFromStorage() {
  console.log("Recreating alarms from storage...");

  try {
    const items = await browser.storage.local.get(null);
    const now = Date.now();
    let recreatedCount = 0;
    let expiredCount = 0;

    for (const [key, value] of Object.entries(items)) {
      // Only process snooze entries (not recurring configs)
      if (key.startsWith("snooze-") && value.snoozeTime) {
        if (value.snoozeTime > now) {
          // Future alarm - recreate it
          browser.alarms.create(key, { when: value.snoozeTime });
          recreatedCount++;
          console.log(`Recreated alarm: ${key} for ${new Date(value.snoozeTime).toLocaleString()}`);
        } else {
          // Expired while browser was closed
          expiredCount++;
          console.log(`Found expired snooze: ${key} - will process immediately`);
        }
      }
    }

    console.log(`Recreated ${recreatedCount} alarms, found ${expiredCount} expired snoozes`);

    // Process any expired snoozes
    if (expiredCount > 0) {
      await checkForSnoozedTabs();
    }
  } catch (error) {
    console.error("Error recreating alarms:", error);
  }
}

// Listener for alarms - MUST be at top level for Firefox event pages
// Single consolidated alarm listener
browser.alarms.onAlarm.addListener(async (alarm) => {
  console.log(`Alarm triggered: ${alarm.name}`);

  // Handle different alarm types
  if (alarm.name === 'keepalive') {
    console.log('Keepalive ping - keeping background script active');
    return;
  }

  if (alarm.name === 'periodic-check') {
    console.log("Running periodic check for snoozed tabs...");
  }

  // Check for snoozed tabs for all non-keepalive alarms
  await checkForSnoozedTabs();
});

// Initialize the extension - runs every time the script loads
async function initializeExtension() {
  console.log("Initializing Tab Snoozer...");

  // Always recreate alarms from storage (handles Firefox script restarts)
  await recreateAlarmsFromStorage();

  // Set up periodic check alarm (for both Chrome and Firefox)
  // This ensures tabs wake up even if specific alarms fail
  await browser.alarms.clear('periodic-check');
  browser.alarms.create('periodic-check', {
    delayInMinutes: 1,    // First check after 1 minute
    periodInMinutes: 5    // Then every 5 minutes
  });
  console.log('Periodic check alarm created');

  // Set up keepalive for Firefox (prevents script from being suspended)
  if (isFirefox) {
    // Clear any existing keepalive
    await browser.alarms.clear('keepalive');

    // Create keepalive alarm that fires every 15 seconds (well under Firefox's 30s limit)
    browser.alarms.create('keepalive', {
      delayInMinutes: 0.25,  // 15 seconds initial delay
      periodInMinutes: 0.25  // Every 15 seconds
    });
    console.log('Keepalive alarm created for Firefox');
  }
}

// Event listeners - MUST be at top level for Firefox event pages
browser.runtime.onInstalled.addListener(async () => {
  console.log("Tab Snoozer installed");
  await initializeExtension();
});

browser.runtime.onStartup.addListener(async () => {
  console.log("Tab Snoozer service worker started");
  await initializeExtension();
});

// Wake on browser action click (when user clicks extension icon)
browser.action.onClicked?.addListener(async () => {
  console.log("Extension icon clicked");
  // This will wake the background script if it's suspended
  await checkForSnoozedTabs();
});

// Initialize immediately when script loads
// This handles Firefox reloading the event page
initializeExtension().catch(console.error);
