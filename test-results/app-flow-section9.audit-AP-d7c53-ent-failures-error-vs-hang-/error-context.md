# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "GolfGive" [ref=e4] [cursor=pointer]:
      - /url: /
      - img [ref=e6]
      - generic [ref=e8]: GolfGive
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Choose your cause" [level=3] [ref=e11]
        - paragraph [ref=e12]: Select a charity that resonates with you
      - generic [ref=e13]:
        - button "Continue" [ref=e16]
        - link "← Back to account details" [ref=e18] [cursor=pointer]:
          - /url: /auth/signup?step=1
    - link "← Back to home" [ref=e20] [cursor=pointer]:
      - /url: /
  - alert [ref=e21]
```