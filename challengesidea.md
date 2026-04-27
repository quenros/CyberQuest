HTML attribute injection — input lands inside an attribute (value="...") instead of the page body. <script> tags won't work here; the user has to break out of the attribute and use an event handler like onfocus or onerror. Still srcdoc, no Docker needed.

DOM-based XSS via innerHTML — a live search/filter that writes results to the DOM unsafely via innerHTML. Teaches that <script> injected through innerHTML doesn't execute — need <img src=x onerror=alert(1)> or <svg onload=alert(1)> instead. last

javascript: URL injection — user input becomes an href. Payload is javascript:alert(1). Teaches a different injection sink that isn't a script tag at all.