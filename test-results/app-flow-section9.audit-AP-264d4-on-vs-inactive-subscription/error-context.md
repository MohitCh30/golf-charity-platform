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
        - heading "Sign in" [level=3] [ref=e11]
        - paragraph [ref=e12]: Enter your credentials to access your account
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - text: Email address
            - textbox "Email address" [ref=e16]
          - generic [ref=e17]:
            - generic [ref=e18]:
              - generic [ref=e19]: Password
              - link "Forgot password?" [ref=e20] [cursor=pointer]:
                - /url: /auth/forgot-password
            - generic [ref=e21]:
              - textbox "Password" [ref=e22]
              - button [ref=e23]:
                - img [ref=e24]
          - button "Sign In" [ref=e27]
        - generic [ref=e28]:
          - text: Don't have an account?
          - link "Sign up" [ref=e29] [cursor=pointer]:
            - /url: /auth/signup
    - link "← Back to home" [ref=e31] [cursor=pointer]:
      - /url: /
  - alert [ref=e32]
```