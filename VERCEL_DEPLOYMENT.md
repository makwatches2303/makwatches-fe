# Vercel Deployment Checklist for MAK Watches

## Pre-Deployment SEO Setup

### 1. Vercel Project Settings

- [ ] Set custom domain: `makwatches.in`
- [ ] Set `www.makwatches.in` as alias (redirects to main domain)
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set environment variables if needed

### 2. Domain Configuration (Vercel DNS)

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Environment Variables (.env)

Already configured:

```
NEXT_PUBLIC_API_BASE_URL=https://api.makwatches.in
```

### 4. Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 5. SEO Files Verification

Check these URLs after deployment:

- ✅ https://makwatches.in/robots.txt
- ✅ https://makwatches.in/sitemap.xml
- ✅ https://makwatches.in/manifest.json
- ✅ https://makwatches.in/favicon.svg
- ✅ https://makwatches.in/favicon.ico

### 6. Meta Tags Verification

Use these tools to verify:

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

Test URLs:

- https://makwatches.in
- https://makwatches.in/men
- https://makwatches.in/women

### 7. Favicon Display

After deployment, verify favicon appears in:

- Browser tab
- Bookmarks
- Mobile home screen (when "Add to Home Screen")
- Social media shares

### 8. Google Search Console

**After deployment:**

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://makwatches.in`
3. Verify ownership using one of these methods:
   - HTML tag (add to layout.tsx)
   - DNS verification
   - HTML file upload

**Get verification code:**

- Click on your property
- Settings > Ownership verification
- Copy the verification code

**Add to layout.tsx:**

```typescript
verification: {
  google: "paste-your-code-here",
}
```

4. Submit sitemap: `https://makwatches.in/sitemap.xml`

### 9. Google Analytics Setup

1. Create GA4 property at [Google Analytics](https://analytics.google.com)
2. Get your Measurement ID (starts with G-)
3. Add to your project:

Create `/src/lib/gtag.ts`:

```typescript
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};
```

Add to `layout.tsx`:

```typescript
<Script
  strategy="afterInteractive"
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
/>
<Script
  id="google-analytics"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `,
  }}
/>
```

### 10. Performance Testing

After deployment, test with:

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

**Target Scores:**

- Performance: 90+
- SEO: 100
- Accessibility: 90+
- Best Practices: 90+

### 11. Social Media Verification

**Test social sharing:**

1. Share on Facebook - verify OG image appears
2. Share on Twitter - verify card displays correctly
3. Share on LinkedIn - verify preview looks good
4. Share on WhatsApp - verify preview appears

### 12. Instagram Bio Update

Update Instagram bio (@makwatches.in) with:

```
🕐 Premium Luxury Watches
🛍️ Shop Now 👇
makwatches.in
```

### 13. Search Visibility Timeline

**Expected timeline for "MAK Watches" to appear in Google:**

- Week 1: Site indexed
- Week 2-4: Brand name appears
- Month 2-3: Organic traffic begins
- Month 3-6: Rankings improve

**Accelerate indexing:**

- Request indexing in Search Console
- Share on social media
- Get backlinks
- Create quality content

### 14. Monitoring Setup

**Weekly checks:**

- [ ] Search Console for errors
- [ ] Google Analytics traffic
- [ ] Website uptime
- [ ] Favicon display across browsers

**Monthly checks:**

- [ ] Ranking for "MAK Watches"
- [ ] Organic traffic growth
- [ ] Page speed scores
- [ ] Mobile usability

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Verify site is live at makwatches.in
- [ ] Check all pages load correctly
- [ ] Test favicon on desktop & mobile
- [ ] Verify robots.txt is accessible
- [ ] Verify sitemap.xml is accessible
- [ ] Test OG tags with Facebook debugger
- [ ] Submit to Google Search Console
- [ ] Install Google Analytics

### Week 1

- [ ] Request indexing for key pages
- [ ] Share website on Instagram
- [ ] Share on other social platforms
- [ ] Monitor Search Console for errors
- [ ] Check initial Analytics data

### Month 1

- [ ] Review Search Console performance
- [ ] Analyze traffic sources
- [ ] Create first blog post
- [ ] Start link building efforts
- [ ] Collect customer feedback

## Quick Commands

**Build locally to test:**

```bash
npm run build
npm run start
```

**Check for errors:**

```bash
npm run lint
```

**Test production build:**

```bash
npm run build && npm run start
```

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Next.js SEO: https://nextjs.org/learn/seo
- Google Search Central: https://developers.google.com/search
- Instagram Business: https://business.instagram.com/

---

**Deploy with confidence! 🚀**
