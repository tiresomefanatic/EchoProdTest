<h2 style="text-align: left">
<span>Introduction</span>
</h2>
<p style="text-align: left">
<span>Tokens are a set of foundational design decisions represented as reusable data. These tokens are shared across all platforms, iOS, Android, and Web, and control the entire visual part of our design system.</span>
</p>
<h2 style="text-align: left">
<span>Anatomy</span>
</h2>
<p style="text-align: left">
<span>Each design token has a unique name and its corresponding value. This name/value pairing is similar to a dictionary data structure found in engineering, where a key is associated with a value, and the key/value pair can be used to store and retrieve data.</span>
</p>
<p style="text-align: left"><strong><img src="https://raw.githubusercontent.com/tiresomefanatic/EchoProdTest/Digital/public/images/1738568301805-Token-naming.png" alt=""></strong><span><strong>Name (required) </strong></span>
</p>
<p style="text-align: left">
<span>The most integral part of a design token is its name – it is how it will be known and referenced across all platforms. Naming is inherently complex – you can always reference the naming convention of each token type on its respective documentation page for more details.</span>
</p>
<p style="text-align: left">
<span><strong>Type (optional)</strong></span>
</p>
<p style="text-align: left">
<span>While design tokens can represent any design decision, there are a handful of established token types in W3C that summarize the purpose of the token and are often referenced by our tooling.</span>
</p>
<p style="text-align: left">
<span><strong>Value (required)</strong></span>
</p>
<p style="text-align: left">
<span>A design token's value is the specific data that defines a design property and is associated with a particular token name. Depending on the token and its complexity, there are several types of data supported, String, Number, Color, Boolean<br>Object, Array, and Null</span>
</p>
<p style="text-align: left">
<span><strong>Description (optional)</strong></span>
</p>
<p style="text-align: left">
<span>Beyond name and value, a design token can have a description property to provide additional information to the user. It's most often used to:<br>
<br>- Provide purpose &amp; context<br>- Provide usage guidance<br>- Any relevant design considerations<br>- Caveats &amp; Limitations</span>
</p>
<h2 style="text-align: left">
<span>Principles</span>
</h2>
<p style="text-align: left">
<span><strong>Shared language</strong></span>
</p>
<p style="text-align: left">
<span>Design tokens provide a common language between designers and developers.</span>
</p>
<p style="text-align: left">
<span><strong>Consistency</strong></span>
</p>
<p style="text-align: left">
<span>Remember that it takes a long time to cement a consistent “feel” with our users, but it takes very little to break it. Design tokens ensure consistency in our design system, connecting each element to a predefined style and, therefore, a design token</span>
</p>
<p style="text-align: left">
<span><strong>Reusability</strong></span>
</p>
<p style="text-align: left">
<span>Design tokens provide a predefined set of options that can be applied to multiple use cases across our system, driving system adoption on the subcomponent level.<br>Using raw values directly in code is poor practice for maintenance and future changes, mainly because we support themes and accessibility features like Dark Mode. Proper tokens allow themes to work seamlessly across multiple platforms – iOS, Android, and the Web.</span>
</p>
<h2 style="text-align: left">
<span>Tiers</span>
</h2>
<p style="text-align: left">
<span>Design tokens follow a 3 tier model based on whether the token stores an option or a decision. Each tier is referenced by the one above it (refer to as aliasing).</span>
</p>
<p style="text-align: left">
<img src="https://raw.githubusercontent.com/tiresomefanatic/EchoProdTest/Digital/public/images/1738568530572-tiers.png" alt="">
</p>
<p style="text-align: left">
<span><strong>Primitive Tokens</strong></span>
</p>
<p style="text-align: left">
<span>Primitive tokens store all the raw data in a platform and usage-agnostic way. In most cases, this level of tokens is not intended for standalone usage and serves as a foundational level of abstraction.</span>
</p>
<p style="text-align: left">
<span><strong>Semantic Tokens</strong></span>
</p>
<p style="text-align: left">
<span>A semantic token, also known as an alias token, is an abstraction layer that reflects the usage of a value in the UI instead of the literal value.</span>
</p>
<p style="text-align: left">
<span><strong>Component-specific tokens</strong></span>
</p>
<p style="text-align: left">
<span>Component-specific tokens are primarily found in our codebases and not so much in Figma. Their primary role is to represent the properties associated with a component.<br>Unlike the previous two tiers, these tokens are self-contained, meaning modifying the underlying value of the token will not affect anything outside the component it's used in.</span>
</p>
<p style="text-align: left">
</p>