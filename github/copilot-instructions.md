# Best Practices for Chrome Extension Code Generation with Examples

This document outlines the guidelines for generating code for a Google Chrome extension, using the following technologies:

* **Modern JavaScript:** The latest syntax and features of the language.
* **React 19:** The most recent version of the library for building user interfaces.
* **Vite:** A fast bundler for frontend development.
* **Tailwind CSS:** A utility-first CSS framework for rapid styling.
* **TypeScript:** A superset of JavaScript that adds static typing.

The generated code should be **simples, human-readable, and should not contain comments**. Clarity should be achieved through code structure, descriptive variable and function names, and the use of the most modern and expressive syntax possible.

## General Principles

1.  **Clarity Over Comments:** The code should be self-explanatory. Utilize variable, function, and component names that describe clearly their purpose. Keep functions small and focused on a single task.

    * **Bad Example (Unclear Naming, needs comments):**
        ```typescript
        // Processes input array
        function p(a) {
          let r = [];
          for (let i = 0; i < a.length; i++) {
            r.push(a[i] * 2);
          }
          return r;
        }
        ```
    * **Good Example (Clear Naming, self-explanatory):**
        ```typescript
        function processNumbersDoubling(numbers: number[]): number[] {
          const doubledNumbers: number[] = [];
          for (const number of numbers) {
            doubledNumbers.push(number * 2);
          }
          return doubledNumbers;
        }
        ```

2.  **Simplicity:** Opt always for the simplest and most direct solution. Avoid unnecessary abstractions or complex patterns that make understanding difficult.

3.  **Modernity:** Utilize the latest syntax and resources of JavaScript, React, and HTML always when appropriate to improve readability and expressiveness of the code.

4.  **Strict Typing with TypeScript:** Take full advantage of TypeScript to define clear types for props, state, and any other data structures. This improves maintainability and helps prevent errors during development.

5.  **Consistent Structure:** Maintain a logical and consistent file and folder structure to facilitate navigation and understanding of the project.

## Specific Guidelines by Technology

### TypeScript

* Utilize explicit typing for component props, state, and function return types, even when TypeScript can infer the type. This increases clarity.

    ```typescript
    interface User {
      id: number;
      name: string;
    }

    interface UserProfileProps {
      user: User;
      isActive: boolean;
    }

    function UserProfile({ user, isActive }: UserProfileProps): JSX.Element {
      // Component logic
      return (
        <div>
          <span>{user.name}</span>
          <span>Status: {isActive ? 'Active' : 'Inactive'}</span>
        </div>
      );
    }

    function fetchUserData(userId: number): Promise<User> {
      // Fetch data logic
      return Promise.resolve({ id: userId, name: 'Example User' });
    }
    ```

* Define Interfaces or Types for complex objects and data structures. (See `User` interface example above).

* Use union (`|`) and intersection (`&`) types to express complex relationships between types.

    ```typescript
    type Status = 'loading' | 'success' | 'error';

    interface LoadingState {
      status: 'loading';
    }

    interface SuccessState {
      status: 'success';
      data: User[];
    }

    interface ErrorState {
      status: 'error';
      message: string;
    }

    type FetchState = LoadingState | SuccessState | ErrorState;

    // Example usage
    const currentState: FetchState = { status: 'loading' };
    ```

* Avoid `any` whenever possible. If necessary, utilize `unknown` with adequate type checking.

    * **Bad Example:**
        ```typescript
        function processData(data: any) {
          // ...
        }
        ```
    * **Good Example:**
        ```typescript
        function processData(data: unknown) {
          if (typeof data === 'string') {
            // Process string
          } else if (typeof data === 'number') {
            // Process number
          }
          // ... handle other types or throw error
        }
        ```

### React 19

* Utilize functional components with Hooks to manage state and side effects.

    ```typescript
    import React, { useState, useEffect } from 'react';

    interface CounterProps {
      initialCount?: number;
    }

    function Counter({ initialCount = 0 }: CounterProps): JSX.Element {
      const [count, setCount] = useState<number>(initialCount);

      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      );
    }
    ```

* Prefer modern JSX syntax, omitting boolean props when their value is `true` (ex: `<Component isDisabled />` instead of `<Component isDisabled={true} />`).

    ```typescript
    interface ButtonProps {
      onClick: () => void;
      disabled?: boolean;
    }

    function SubmitButton({ onClick, disabled }: ButtonProps): JSX.Element {
      return (
        <button onClick={onClick} disabled={disabled}>
          Submit
        </button>
      );
    }

    // Usage
    <SubmitButton onClick={() => {}} disabled />; // Modern syntax
    <SubmitButton onClick={() => {}} disabled={false} />;
    ```

* Use desestruturação para props e estado for more concise access. (See examples above).

* Use React.Fragment (`<>...</>`) when you need to group elements without adding an extra node to the DOM.

    * **Bad Example (adds unnecessary div):**
        ```typescript
        function ItemsList({ items }: { items: string[] }): JSX.Element {
          return (
            <div>
              {items.map(item => (
                <div key={item}>{item}</div>
              ))}
            </div>
          );
        }
        ```
    * **Good Example (uses Fragment):**
        ```typescript
        function ItemsList({ items }: { items: string[] }): JSX.Element {
          return (
            <>
              {items.map(item => (
                <div key={item}>{item}</div>
              ))}
            </>
          );
        }
        ```

* Whenever rendering lists, utilize the prop `key` appropriately to help React identify which items have changed, been added, or removed. (See `ItemsList` example above).

### Modern JavaScript

* Utilize `const` and `let` instead of `var`. (See examples above).

* Prefer Arrow Functions (`=>`) for anonymous functions and callbacks due to their concise syntax and `this` behavior. (See `Counter` and `ItemsList` examples above).

* Utilize Template Literals (`` ` ``) for complex string concatenation.

    ```typescript
    const userName = 'Alice';
    const message = `Hello, ${userName}!`; // Modern
    // const message = 'Hello, ' + userName + '!'; // Older syntax
    ```

* Take advantage of object and array destructuring.

    ```typescript
    const user = { id: 1, name: 'Bob', email: 'bob@example.com' };
    const { name, email } = user; // Object destructuring

    const numbers = [1, 2, 3, 4];
    const [first, second, ...rest] = numbers; // Array destructuring
    ```

* Use `async/await` to handle asynchronous operations more readably than with `.then()`.

    ```typescript
    async function loadUserData(userId: number): Promise<User | null> {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: User = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
      }
    }
    ```

* Use the spread syntax (`...`) to copy arrays/objects or to pass props to components.

    ```typescript
    const oldArray = [1, 2];
    const newArray = [...oldArray, 3, 4]; // Copy and add elements

    const oldObject = { a: 1, b: 2 };
    const newObject = { ...oldObject, c: 3 }; // Copy and add/override properties

    interface CardProps {
      title: string;
      content: string;
    }

    function Card(props: CardProps): JSX.Element {
      // ... component logic
      return <div>{props.title}</div>;
    }

    const cardData = { title: 'My Card', content: 'Card content' };
    <Card {...cardData} />; // Spread props
    ```

### Vite

* Configure Vite to handle the different entry points of the extension (popup, options page, content scripts, background script), as required in the file `manifest.json`.

    ```json
    // manifest.json (Example snippet)
    {
      "manifest_version": 3,
      "name": "My Chrome Extension",
      "version": "1.0",
      "action": {
        "default_popup": "popup.html" // Points to an HTML file handled by Vite
      },
      "options_ui": {
        "page": "options.html", // Points to another HTML file handled by Vite
        "open_in_tab": true
      },
      "background": {
        "service_worker": "src/background/background.ts" // Points to a script handled by Vite
      },
      "content_scripts": [
        {
          "matches": ["<all_urls>"],
          "js": ["src/content/contentScript.ts"] // Points to a script handled by Vite
        }
      ],
      "permissions": [
        "storage",
        "activeTab"
        // ... other permissions
      ]
    }
    ```

* Utilize the recommended plugins for React and TypeScript in `vite.config.ts`.

    ```typescript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      // Configure build output for extension assets if necessary
      build: {
        rollupOptions: {
          input: {
            popup: 'popup.html',
            options: 'options.html',
            background: 'src/background/background.ts',
            contentScript: 'src/content/contentScript.ts',
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
    });
    ```

### Tailwind CSS

* Apply classes directly in JSX elements.

    ```typescript
    function StyledButton(): JSX.Element {
      return (
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Click Me
        </button>
      );
    }
    ```

* Utilize the default Tailwind configuration whenever possible. If customizations are necessary, define them in the file `tailwind.config.js`.

    ```javascript
    // tailwind.config.js
    /** @type {import('tailwindcss').Config} */
    export default {
      content: [
        './index.html',
        './popup.html',
        './options.html',
        './src/**/*.{js,ts,jsx,tsx}',
      ],
      theme: {
        extend: {
          colors: {
            'custom-blue': '#243c5a',
          },
        },
      },
      plugins: [],
    };
    ```

* Avoid creating separate custom CSS classes unless strictly necessary to abstract complex sets of reusable utilities.

### Chrome Extension Code

* Structure the project according to Chrome extension requirements, including the `manifest.json` file. (See `manifest.json` example above).

* Implement communication between the different parts of the extension (popup, content script, background script) using the Chrome messaging API.

    * **Sending a message from Popup to Content Script:**
        ```typescript
        // src/popup/Popup.tsx
        function Popup(): JSX.Element {
          const sendMessageToContentScript = () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight_text' });
              }
            });
          };

          return (
            <div>
              <h1>Extension Popup</h1>
              <button onClick={sendMessageToContentScript}>Highlight Page Text</button>
            </div>
          );
        }
        ```
    * **Receiving a message in Content Script:**
        ```typescript
        // src/content/contentScript.ts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === 'highlight_text') {
            document.body.style.backgroundColor = 'yellow';
            sendResponse({ status: 'success' });
          }
          // If you need to send an asynchronous response, return true here
          // return true;
        });
        ```
    * **Sending/Receiving in Background Script:** Similar patterns using `chrome.runtime.onMessage` and `chrome.tabs.sendMessage` or `chrome.runtime.sendMessage`.

## Formatting and Style

* Utilize consistent indentation (two or four spaces).
* Maintain a consistent naming convention (camelCase for variables and functions, PascalCase for components and Types/Interfaces).
* Keep code lines at a reasonable length to avoid the necessity of horizontal scrolling.

By adhering to these best practices, the generated code will be modern, efficient, and most importantly, easy for a human developer to read, understand, and maintain, even in the absence of explicit comments.