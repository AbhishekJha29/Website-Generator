"use client";

import React, { useContext, useEffect, useRef, useState } from 'react'
import WebPageTools from './WebPageTools';
import ElementSettingsSection from './ElementSettingsSection';
import ImageSettingSection from './ImageSettingSection';
import { OnSaveContext } from '@/context/OnSaveContext';
import { toast } from 'sonner';
import { useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';

type Props = {
  generatedCode: string
}

const HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="AI Website Builder - Modern TailwindCSS + Flowbite Template">
  <title>AI Website Builder</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Flowbite CSS & JS -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>

  <!-- Font Awesome / Lucide -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- AOS -->
  <link href="https://cdnjs.cloudflare.com/2.3.4/aos.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>

  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

  <!-- Lottie -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.11.2/lottie.min.js"></script>

  <!-- Swiper -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js"></script>

  <!-- Tippy.js -->
  <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />
  <script src="https://unpkg.com/@popperjs/core@2"></script>
  <script src="https://unpkg.com/tippy.js@6"></script>
  <style>
    [data-selected="true"] {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px;
    }
    [data-hover="true"]:not([data-selected="true"]) {
      outline: 2px dotted #93c5fd !important;
      outline-offset: 2px;
    }
    [contenteditable="true"]:focus {
      outline: 2px solid #2563eb !important;
    }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`

function WebsiteDesign({ generatedCode }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedScreenSize, setSelectedScreenSize] = useState('web')
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const {onSaveData, setOnSaveData} = useContext(OnSaveContext)
  const { projectId} = useParams();
  const params = useSearchParams();
  const frameId = params.get('frameId');
  // Track the current selected element reference internally to manage styles
  const internalSelectedElRef = useRef<HTMLElement | null>(null);
  const internalHoverElRef = useRef<HTMLElement | null>(null);

  // Initialize iframe shell
  useEffect(() => {
    if (!iframeRef.current) return;
    console.log('Initializing iframe shell...');
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(HTML_CODE);
    doc.close();
  }, []);

  // Handle element selection and events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupListeners = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      console.log('Attaching listeners to iframe document...');

      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target === doc.body || target === doc.documentElement || target.id === 'root') return;
        
        if (internalSelectedElRef.current && internalSelectedElRef.current.contains(target)) return;

        if (internalHoverElRef.current && internalHoverElRef.current !== target) {
          internalHoverElRef.current.removeAttribute('data-hover');
        }
        internalHoverElRef.current = target;
        target.setAttribute('data-hover', 'true');
      };

      const handleMouseOut = (e: MouseEvent) => {
        if (internalHoverElRef.current) {
          internalHoverElRef.current.removeAttribute('data-hover');
          internalHoverElRef.current = null;
        }
      };

      const handleClick = (e: MouseEvent) => {
        // Prevent navigation on all clicks, especially links
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        console.log('Click detected on:', target.tagName, target);

        // Don't select the root or body
        if (target === doc.body || target === doc.documentElement || target.id === 'root') {
          clearSelection();
          return;
        }

        // Remove old selection styles
        if (internalSelectedElRef.current) {
          internalSelectedElRef.current.removeAttribute('data-selected');
          internalSelectedElRef.current.removeAttribute('contenteditable');
        }

        // Set new selection
        internalSelectedElRef.current = target;
        target.setAttribute('data-selected', 'true');
        target.setAttribute('contenteditable', 'true');
        
        // Remove hover style if it's selected
        target.removeAttribute('data-hover');

        console.log('Setting selected element state...');
        setSelectedElement(target);
      };

      const clearSelection = () => {
        if (internalSelectedElRef.current) {
          internalSelectedElRef.current.removeAttribute('data-selected');
          internalSelectedElRef.current.removeAttribute('contenteditable');
          internalSelectedElRef.current = null;
        }
        setSelectedElement(null);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          clearSelection();
        }
      };

      doc.addEventListener('mouseover', handleMouseOver);
      doc.addEventListener('mouseout', handleMouseOut);
      doc.addEventListener('click', handleClick, true); // Use capture phase to intercept everything
      doc.addEventListener('keydown', handleKeyDown);

      return () => {
        doc.removeEventListener('mouseover', handleMouseOver);
        doc.removeEventListener('mouseout', handleMouseOut);
        doc.removeEventListener('click', handleClick, true);
        doc.removeEventListener('keydown', handleKeyDown);
      };
    };

    // Wait for iframe to be ready
    const interval = setInterval(() => {
      const doc = iframe.contentDocument;
      if (doc && doc.readyState === 'complete' && doc.getElementById('root')) {
        clearInterval(interval);
        setupListeners();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Update body only when code changes
  useEffect(() => {
    if (!iframeRef.current || !generatedCode) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    const root = doc.getElementById("root");
    if (root) {
      console.log('Injecting generated code...');
      
      // Clean the code: remove html, head, body tags if present
      const cleanCode = generatedCode
        .replace(/```html/g, "")
        .replace(/```/g, "")
        .replace(/<html[^>]*>/gi, "")
        .replace(/<\/html>/gi, "")
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
        .replace(/<body[^>]*>/gi, "")
        .replace(/<\/body>/gi, "");

      root.innerHTML = cleanCode;

      // Reset selection if the selected element is no longer in the DOM
      if (selectedElement && !doc.contains(selectedElement)) {
        setSelectedElement(null);
        internalSelectedElRef.current = null;
      }
    }
  }, [generatedCode]);

  useEffect (() => {
   onSaveData && onSaveCode();
  },[onSaveData]);

  const onSaveCode = async () => {
    if (iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (iframeDoc) {
          // Get the root element where the actual website content resides
          const rootElement = iframeDoc.getElementById('root');
          if (!rootElement) {
            console.error('Save failed: #root element not found in iframe.');
            toast.error('Could not find website content to save.');
            return;
          }

          // Clone the root to perform cleanup without affecting the live preview
          const cleanRoot = rootElement.cloneNode(true) as HTMLElement;

          // Helper function to recursively remove all editor-specific attributes and styles
          const cleanupElement = (el: HTMLElement) => {
            // Remove editor-only attributes
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-selected');
            el.removeAttribute('data-hover');
            el.removeAttribute('spellcheck');
            
            // Clear temporary editor styles that are used for UI feedback
            if (el.style) {
              el.style.outline = '';
              el.style.outlineOffset = '';
              el.style.cursor = '';
            }

            // Process all children recursively
            Array.from(el.children).forEach((child) => {
              if (child instanceof HTMLElement) {
                cleanupElement(child);
              }
            });
          };

          // Run cleanup on the cloned root
          cleanupElement(cleanRoot);

          // Get only the actual website HTML inside #root
          const html = cleanRoot.innerHTML;
          
          console.log("Saving clean website content...");

          // Wrap in markdown for compatibility with the existing project loader
          const designCode = `\`\`\`html\n${html}\n\`\`\``;

          const result = await axios.put('/api/frames', {
            designCode: designCode,
            frameId: frameId,
            projectId: projectId
          });

          if (result.status === 200 || result.status === 204) {
            console.log('Save successful');
            toast.success('Saved successfully!');
          }
        }
      } catch (error) {
        console.error('Error saving website:', error);
        toast.error('Failed to save changes.');
      }
    }
  };

  return (
    <div className='flex gap-2 w-full h-[90vh]'>
      <div className='p-5 flex-1 flex items-center flex-col overflow-hidden'>
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl border overflow-hidden">
          <iframe
            ref={iframeRef}
            className={`transition-all duration-300 shadow-2xl bg-white ${selectedScreenSize === 'web' ? 'w-full' : 'w-[400px]'} h-full border-0`}
            sandbox="allow-scripts allow-same-origin"
            title="Design Canvas"
          />
        </div>
        <div className="mt-4 w-full">
          <WebPageTools 
            selectedScreenSize={selectedScreenSize}
            setSelectedScreenSize={(v: string) => setSelectedScreenSize(v)}
            generatedCode={generatedCode} 
          />
        </div>
      </div>
{/* Setting Section */}
{selectedElement && (
  <div className="w-96 flex-shrink-0 bg-white border-l overflow-y-auto">
    {selectedElement.tagName === 'IMG' ? (
      <ImageSettingSection selectedEl={selectedElement as HTMLImageElement} />
    ) : (
      <ElementSettingsSection 
        selectedEl={selectedElement} 
        clearSelection={() => {
          if (internalSelectedElRef.current) {
            internalSelectedElRef.current.removeAttribute('data-selected');
            internalSelectedElRef.current.removeAttribute('contenteditable');
            internalSelectedElRef.current = null;
          }
          setSelectedElement(null);
        }} 
      />
    )}
  </div>
)}
</div>
  );
}

export default WebsiteDesign;
