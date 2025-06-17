<h1 style="text-align: left"><strong>Color</strong>
</h1>
<p style="text-align: left">Colours bring the Echo interface to life. From system feedback to brand identity, colour tokens in Echo are designed to be expressive, accessible, and consistent across platforms.
</p>
<p style="text-align: left">
<img src="https://bucket-production-5169.up.railway.app/uploads/uploads/1743580007629-15b99212-1743580004107-jij2vaood1f.gif" alt="test">
</p>
<p style="text-align: left">
</p>
<h2 style="text-align: left"><strong>Primary color</strong>
</h2>
<p style="text-align: left">Primitive colours in the Echo Design System are the foundational hues that define the visual identity and guide the creation of harmonious, accessible, and expressive UI themes. These colours serve as the base palette from which all other derived tokens (e.g., semantic colours, themes) are built.
</p>
<p style="text-align: left">
<img src="https://bucket-production-5169.up.railway.app/uploads/uploads/1748844832292-c2da81fd-1748844831494-750yfnrd0ae.jpg" alt="The primitive colours of Hero Design System.">Each primitive hue is expanded into a <strong>9-point scale</strong> of tints and shades, enabling a rich yet controlled design vocabulary.
</p>
<h3 style="text-align: left">
<span style="font-size: 24px">Colour Scale Logic</span>
</h3>
<p style="text-align: left">Each primitive colour has a <strong>9-step scale</strong>, ranging from light tints to deep shades:
</p>
<p style="text-align: left">
<code>100 - 400</code><strong> :</strong> <strong>Tints</strong> — for background fills and subtle UI elements
</p>
<p style="text-align: left">
<code>500</code><strong> :</strong> <strong>Base</strong> — default brand or role-based usage
</p>
<p style="text-align: left">
<code>600 - 900</code><strong> :</strong> <strong>Shades</strong> — for text, active states, borders, and dark surfaces
</p>
<p style="text-align: left">Example: Cyan Colour Scale
</p>
<p style="text-align: left">
<img src="https://bucket-production-5169.up.railway.app/uploads/uploads/1748615665029-5942c027-1748615663513-aqpwxx3wukj.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&amp;X-Amz-Credential=cipRRh8D5NgHPVuaj4zW8kzGQg6EUsES%2F20250602%2Fus-east-1%2Fs3%2Faws4_request&amp;X-Amz-Date=20250602T061645Z&amp;X-Amz-Expires=86400&amp;X-Amz-SignedHeaders=host&amp;X-Amz-Signature=e5af002505304f0429f152df0e0903c8a0c776602f57d50515012e92044f0838" alt="uploads/1748615665029-5942c027-1748615663513-aqpwxx3wukj.jpg">This scale structure applies identically to Red, Yellow, Green, Blue, and the Brand colours.
</p>
<h3 style="text-align: left">
<span style="font-size: 24px">Naming Convention</span>
</h3>
<p style="text-align: left">Echo follows a naming convention based on: <strong>Colour/Value</strong>
</p>
<p style="text-align: left">
<span style="font-size: 16px">Where:</span>
</p>
<p style="text-align: left"><strong>`Colour`</strong> is the hue family (e.g. <code>Cyan</code>, <code>Red</code>, <code>Neutral</code>)
</p>
<p style="text-align: left"><strong>`Value`</strong>is the numeric weight (<code>100</code> to <code>900</code>, with <code>500</code> as the base)
</p>
<p style="text-align: left">
<br>
<span style="font-size: 18px">Examples:</span>
</p>
<p style="text-align: left">
<span style="font-size: 16px"><strong>`Cyan/500`</strong>→ Base cyan accent</span>
</p>
<p style="text-align: left">
<span style="font-size: 16px"><strong>`Green/100`</strong>→ Light green background</span>
</p>
<p style="text-align: left">
<span style="font-size: 16px"><strong>`Neutral/900`</strong>→ Deep neutral for text</span>
</p>
<h2 style="text-align: left"><strong>Semantic colour</strong>
</h2>
<p style="text-align: left">While primitive colours define the raw hues and values, <strong>semantic colours</strong> map those values to <strong>functional roles</strong> in the UI—like indicating status, structuring layers, or guiding user interaction. These mappings ensure that the same logic and visual language are applied consistently across surfaces, states, and modes.
</p>
<p style="text-align: left">
</p>
<p style="text-align: left">
<span style="font-size: 24px">Naming Convention</span>
</p>
<p style="text-align: left">Echo follows the format:
</p>
<p style="text-align: left">"[Category] [Role] → maps to → [Primitive/Scale]"<br>
</p>
<p style="text-align: left">
<span style="font-size: 18px">Examples:</span>
</p>
<p style="text-align: left">
<code>[Content] [Primary]</code> → <code>[Neutral]/[900]</code>
</p>
<p style="text-align: left">
<code>[Background Notice] [Subtle]</code> → <code>[Yellow]/[100]</code>
</p>
<p style="text-align: left">
<code>[Border] [Positive]</code> → <code>[Green]/[600]</code>
</p>
<p style="text-align: left">
</p>
<p style="text-align: left">
<span style="font-size: 24px">Semantic tokens communicate meaning. They're categorized into:</span>
</p>
<p style="text-align: left">1. Content Tokens
</p>
<p style="text-align: left">2. Background Tokens
</p>
<p style="text-align: left">3. Border Tokens
</p>
<p style="text-align: left">4. Surface Tokens
</p>
<p style="text-align: left">5. Overlay Tokens
</p>
<h2 style="text-align: left">
<span style="font-size: 24px">1. Content Token:</span>
</h2>
<p style="text-align: left">These define text colours
</p>
<p style="text-align: left">
</p>
<h2 style="text-align: left"><strong>Color accessibility chart</strong>
</h2>
<p style="text-align: left">This chart aims to help enhance the readability and visibility of text by our branding elements by ensuring sufficient contrast between text (foreground) and background colors. This adherence is crucial for accessibility and to comply with the Web Content Accessibility Guidelines (WCAG).
</p>
<h3 style="text-align: left"><strong>AAA (Enhanced):</strong>
</h3>
<p style="text-align: left">Minimum contrast ratio of 7:1 for normal text Minimum contrast ratio of 4.5:1 for large text (18pt and larger, or 14pt and bold)
</p>
<h3 style="text-align: left"><strong>AA (Standard):</strong>
</h3>
<p style="text-align: left">Minimum contrast ratio of 4.5:1 for normal text Minimum contrast ratio of 3:1 for large text (18pt and larger, or 14pt and bold)
</p>
<h3 style="text-align: left"><strong>AA18:</strong>
</h3>
<p style="text-align: left">Applies to large text only Minimum contrast ratio of 3:1
</p>
<h3 style="text-align: left"><strong>FAIL:</strong>
</h3>
<p style="text-align: left">Any combination not meeting the above criteria
</p>
<p style="text-align: left">Regularly audit existing digital and printed materials for compliance with these guidelines. By following these guidelines, we ensure our brand materials are accessible, enhancing the experience for all users, including those with visual impairments.
</p>
<p style="text-align: left">
<img src="/images/color-accessibility-chart.png" alt="Color Accessibility Chart">
</p>