---
order: 5
slug: "typography-system"
title: "Building a Scalable Typography System"
description: "Creating a consistent typography system that balanced design, SEO, accessibility, and technical requirements."
cover: "/case-studies/typography-system/cover.png"
role: "Product Designer"
timeline: ""
platform: "Web Product"
year: "2024"
tools: "Figma"
---
## Overview

The product needed a typography system that could do more than look consistent.

It had to support design hierarchy, work across different product surfaces, meet marketing and SEO requirements, and remain practical for the technical team to implement and maintain.

The goal was to turn those competing needs into one scalable system.


## Problem Statement

The existing typography approach couldn’t satisfy all teams at once.

Marketing and SEO required a consistent heading structure across the product, while design needed more flexibility in visual scale across different pages. At the same time, the technical team needed a system that could be implemented consistently without introducing unnecessary complexity.

The challenge was to separate semantic hierarchy from visual size and create rules that worked for everyone.

## Typography Categories

After reviewing the existing design system and product requirements, we organized typography into four core categories:

**Heading · Body · CTA · Display**

Each category had a distinct role, making the system easier to use consistently across both design and development.

![Typography categories in the design system](/case-studies/typography-system/typography-categories.png "wide")

## Heading Typography

To make heading styles clear and consistent across the product, we defined six heading sizes. This also allowed smaller headings to retain their semantic importance in sections where SEO hierarchy mattered.

## CTA Typography

For call-to-action (CTA) elements, we created a dedicated typography category to keep action-focused text consistent across the product.

![Heading and CTA typography styles](/case-studies/typography-system/heading-cta-typography.png "wide")

## Flexible H1 Sizing

Our H1 size varies from **32px to 64px on desktop**, depending on the page context. Marketing and SEO required a consistent H1 across all pages, but using the largest size everywhere didn’t always work visually.

To balance both needs, we created multiple visual sizes for H1 while keeping the same semantic H1 structure in development. The landing page uses the largest **64px** variant, while other pages can use smaller H1 sizes when the layout requires it.

![H1 typography size variants](/case-studies/typography-system/h1-variants.png "wide")

## Choosing the Right Type Unit

Before defining the typography scale, we compared the three CSS units most relevant to font sizing: **px, em, and rem**.

**px** provides a fixed CSS value and is simple to work with, but it doesn’t inherit its scale from the surrounding typography system.

**em** is relative to the font size of its context, which makes it flexible but can also create compounding values when elements are nested.

**rem** is relative to the root HTML font size, giving us a single, predictable reference point across the product.

Understanding these differences helped us choose a unit that could keep the typography system consistent while still supporting scalable sizing.

This comparison was informed by [CSS units for font-size: px, em, and rem](https://medium.com/@dixita0607/css-units-for-font-size-px-em-rem-79f7e592bb97).

![Comparison of px, em, and rem units](/case-studies/typography-system/type-units-comparison.png "wide")

## Why We Chose rem

We chose **rem** for the typography system because it gave us one predictable reference point while still allowing the system to scale consistently.

**Scalability:** Since rem values are based on the root font size, the typography scale can be adjusted from a shared base instead of changing individual styles.

**Accessibility:** Relative sizing can better respect a user’s browser font preferences, making the interface more adaptable when larger text is needed.

**Consistency:** Using one shared base helped us maintain proportional relationships across headings, body text, CTAs, and display styles.

We used the browser’s standard **16px base**, where **1rem = 16px**, as the reference for the typography scale.

This approach was informed by [Finsweet’s Client-First guidance on rem sizing](https://finsweet.com/client-first/docs/sizes-and-rem).

For responsive implementation, we also reviewed [Zell Liew’s comparison of px, em, and rem in media queries](https://zellwk.com/blog/media-query-units/?source=post_page-----79f7e592bb97--------------------------------) to better understand how relative units behave across breakpoints.

## Applying the rem Scale

We applied the rem-based scale across the product using a **16px root font size** as our baseline.

With this foundation, our primary body style, **B1**, was set to **1rem (16px)**, giving the rest of the typography system a consistent reference point.

## Heading Styles

The final heading system includes **six levels**, each defined by its role in the content hierarchy.

H1 remains the primary heading on every page to meet marketing and SEO requirements, while its three visual size variants give the design enough flexibility across different layouts.

![Heading typography styles](/case-studies/typography-system/heading-styles.png "wide")

## Body Styles

We defined two body text styles to cover the main reading needs across the product.

**B1** is the primary body style at **1rem (16px)**, while **B2** uses a smaller **0.875rem (14px)** size for tighter spaces where a more compact text style is needed.

![Body typography styles](/case-studies/typography-system/body-styles.png "wide")

## CTA Styles

We created a dedicated CTA category to keep action-focused text consistent across the product.

**C1** is used for primary CTA labels at **1rem (16px)** with a bold weight, while **C2** uses the same size with a regular weight for supporting CTA captions.

![CTA typography styles](/case-studies/typography-system/cta-styles.png "wide")

## Display Styles

We created the Display category for less frequent, more expressive typography that didn’t fit into the core Heading, Body, or CTA groups.

It includes styles and weights used only in specific contexts—such as Light—and is also intended for text that is visually important but not part of the main semantic or SEO hierarchy.

![Display typography styles](/case-studies/typography-system/display-styles.png "wide")

## Responsive Typography System

The same typography structure and naming system was applied across both desktop and mobile, with sizes adjusted where needed for each breakpoint.

This kept the hierarchy, roles, and implementation logic consistent across the product while allowing the scale to adapt to different screen sizes.

## What I Learned

This project reinforced that typography systems are not only visual decisions. They sit between design, accessibility, SEO, and implementation.

The most effective solution was not to force one rule across every context, but to create a shared system with enough flexibility to support different needs without losing consistency.

