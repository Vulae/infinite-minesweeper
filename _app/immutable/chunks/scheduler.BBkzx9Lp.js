function y(){}function k(t,n){for(const e in n)t[e]=n[e];return t}function w(t){return t()}function S(){return Object.create(null)}function j(t){t.forEach(w)}function E(t){return typeof t=="function"}function A(t,n){return t!=t?n==n:t!==n||t&&typeof t=="object"||typeof t=="function"}function B(t){return Object.keys(t).length===0}function v(t,...n){if(t==null){for(const o of n)o(void 0);return y}const e=t.subscribe(...n);return e.unsubscribe?()=>e.unsubscribe():e}function C(t,n,e){t.$$.on_destroy.push(v(n,e))}function D(t,n,e,o){if(t){const r=m(t,n,e,o);return t[0](r)}}function m(t,n,e,o){return t[1]&&o?k(e.ctx.slice(),t[1](o(n))):e.ctx}function F(t,n,e,o){if(t[2]&&o){const r=t[2](o(e));if(n.dirty===void 0)return r;if(typeof r=="object"){const i=[],f=Math.max(n.dirty.length,r.length);for(let u=0;u<f;u+=1)i[u]=n.dirty[u]|r[u];return i}return n.dirty|r}return n.dirty}function P(t,n,e,o,r,i){if(r){const f=m(n,e,o,i);t.p(f,r)}}function U(t){if(t.ctx.length>32){const n=[],e=t.ctx.length/32;for(let o=0;o<e;o++)n[o]=-1;return n}return-1}function G(t){const n={};for(const e in t)e[0]!=="$"&&(n[e]=t[e]);return n}function H(t,n){const e={};n=new Set(n);for(const o in t)!n.has(o)&&o[0]!=="$"&&(e[o]=t[o]);return e}function I(t){return t&&E(t.destroy)?t.destroy:y}let l;function d(t){l=t}function b(){if(!l)throw new Error("Function called outside component initialization");return l}function J(t){b().$$.on_mount.push(t)}function K(t){b().$$.after_update.push(t)}function L(t){b().$$.on_destroy.push(t)}const a=[],g=[];let s=[];const h=[],x=Promise.resolve();let p=!1;function O(){p||(p=!0,x.then(z))}function N(){return O(),x}function q(t){s.push(t)}function Q(t){h.push(t)}const _=new Set;let c=0;function z(){if(c!==0)return;const t=l;do{try{for(;c<a.length;){const n=a[c];c++,d(n),M(n.$$)}}catch(n){throw a.length=0,c=0,n}for(d(null),a.length=0,c=0;g.length;)g.pop()();for(let n=0;n<s.length;n+=1){const e=s[n];_.has(e)||(_.add(e),e())}s.length=0}while(a.length);for(;h.length;)h.pop()();p=!1,_.clear(),d(t)}function M(t){if(t.fragment!==null){t.update(),j(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(q)}}function R(t){const n=[],e=[];s.forEach(o=>t.indexOf(o)===-1?n.push(o):e.push(o)),e.forEach(o=>o()),s=n}export{I as A,Q as B,L as C,D as a,F as b,C as c,K as d,g as e,S as f,U as g,z as h,E as i,B as j,q as k,R as l,l as m,y as n,J as o,d as p,w as q,j as r,A as s,N as t,P as u,a as v,O as w,k as x,H as y,G as z};
