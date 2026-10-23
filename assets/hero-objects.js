// hero-objects.js — объект первого экрана: пять принципов студии из частиц (WebGL, свой canvas).
// 01 Холодный расчёт — хрустальный ферзь · 02 Точность — оптический прицел · 03 Скорость — ускоритель
// 04 Безопасность — шифровальные роторы · 05 Дизайн — перо рисует бриллиант, чертёж встаёт объёмом.
// API: var h = PTHero.mount(sectionEl, { autostart: false }); h.start(instant); h.replay(); h.go(k); h.setActive(bool); h.destroy(); h.count — число частиц.
// h.relabel() — сразу переписать подписи на текущем языке (движок зовёт при смене языка, до замера букв).
// Без autostart:false объект собирается сразу после mount. start(true) — сразу на месте, без полёта (повторный визит, reduced motion).
// Разметка внутри sectionEl: [data-obj] — панель «Кодекс студии» (модуль ставит ей aria-label, --acc и data-slot);
// [data-usp="0..4"] — вкладки принципов с [data-usp-fill] и скрытыми .usp-n (название) / .usp-t (описание);
// [data-objcapw] > [data-captitle] + [data-objcap] — подпись активного принципа; [data-prev]/[data-next] — стрелки,
// [data-ring] — кольцо до автосмены; [data-objname]/[data-objidx] — необязательные подписи.
// Canvas'ы [data-gl]/[data-ov] модуль создаёт сам, если их нет.
(function () {
  var factory = function (root) {
      // ===== общее 3D-ядро частиц для прототипов hero-объекта =====
      var COL = { ice: [0.557, 0.847, 0.973], az: [0.498, 0.659, 1], lil: [0.718, 0.651, 0.949], mint: [0.624, 0.898, 0.82], frost: [0.933, 0.953, 0.965], glass: [0.737, 0.827, 0.871] };
      function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
      function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
      function iri(t) { var L = [COL.ice, COL.az, COL.lil, COL.mint, COL.ice], f = ((t % 1) + 1) % 1 * 4, i = Math.floor(f); return mix3(L[i], L[i + 1], f - i); }
      function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
      function rnd(a, b) { return a + Math.random() * (b - a); }
      // ---- генераторы точек (модельные координаты, единица = S пикселей) ----
      function seg(a, b, o) { var t = Math.random(); o.x = a[0] + (b[0] - a[0]) * t; o.y = a[1] + (b[1] - a[1]) * t; o.z = a[2] + (b[2] - a[2]) * t; return t; }
      function segLen(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
      function sph(c, r, o) { var u = Math.random() * 2 - 1, th = Math.random() * 6.2832, s = Math.sqrt(1 - u * u); o.x = c[0] + r * s * Math.cos(th); o.y = c[1] + r * u; o.z = c[2] + r * s * Math.sin(th); }
      // набор частей: { w, gen(o), col, g } -> выбор по весу
      function Parts() { this.list = []; this.sum = 0; }
      Parts.prototype.add = function (w, gen, col, g, a, s) { this.sum += w; this.list.push({ cw: this.sum, gen: gen, col: col, g: g == null ? 0 : g, a: a == null ? 1 : a, s: s || 1 }); return this; };
      Parts.prototype.segs = function (pairs, col, g, dens, a, s) { var self = this; pairs.forEach(function (p) { self.add(segLen(p[0], p[1]) * (dens || 1), function (o) { seg(p[0], p[1], o); }, col, g, a, s); }); return this; };
      Parts.prototype.pick = function () { var v = Math.random() * this.sum, L = this.list, lo = 0, hi = L.length - 1; while (lo < hi) { var m = (lo + hi) >> 1; if (L[m].cw < v) lo = m + 1; else hi = m; } return L[lo]; };
      function rectPairs(x0, y0, x1, y1, z) { return [[[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]], [[x1, y1, z], [x0, y1, z]], [[x0, y1, z], [x0, y0, z]]]; }
      function boxPairsY(hw, hd, y) { return [[[-hw, y, -hd], [hw, y, -hd]], [[hw, y, -hd], [hw, y, hd]], [[hw, y, hd], [-hw, y, hd]], [[-hw, y, hd], [-hw, y, -hd]]]; }

      function makeCore(host, gcv, ocv, panel, env) {
        var gl = null, c2 = null;
        try { gl = gcv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true }) || gcv.getContext('experimental-webgl', { alpha: true }); } catch (e) { gl = null; }
        if (!gl) c2 = gcv.getContext('2d');
        var oc = ocv.getContext('2d');
        var N = env.n || (env.mob ? 5200 : 10000), D = 3.4;
        var P = new Float32Array(N * 3), V = new Float32Array(N * 3), T = new Float32Array(N * 3), NT = new Float32Array(N * 3);
        var C = new Float32Array(N * 3), CT = new Float32Array(N * 3), NC = new Float32Array(N * 3);
        var A = new Float32Array(N), AT = new Float32Array(N), NA = new Float32Array(N), SZ = new Float32Array(N), NS = new Float32Array(N);
        var G = new Uint8Array(N), NG = new Uint8Array(N), SW = new Float32Array(N), O = new Float32Array(N * 2);
        var UA = new Float32Array(N * 4), NUA = new Float32Array(N * 4), DB = new Float32Array(N).fill(1), SH = new Uint8Array(N), NSH = new Uint8Array(N), dout = { x: 0, y: 0, z: 0, b: 1, snap: false };
        var EXMAX = 3000, EX = new Float32Array(EXMAX * 7), exN = 0;
        var BUF = new Float32Array((N + EXMAX) * 7);
        var gScale = new Float32Array(16).fill(1), gBright = new Float32Array(16).fill(1), gLift = new Float32Array(16), gOn = new Float32Array(16).fill(1);
        var me = { N: N, W: 1, H: 1, dpr: 1, t: 0, cx: 0, cy: 0, S: 100, panel: { x: 0, y: 0, w: 1, h: 1 },
          cam: { yaw: 0.5, pitch: 0.22, spin: 0.16, tyaw: 0, tpitch: 0, follow: 1, hold: false, holdYaw: 0, holdPitch: 0 },
          mouse: { x: -1e5, y: -1e5, in: false }, dyn: [], ya: 0, pi: 0, ps: 1, ab: 1, tint: [1, 1, 1], tk: 0, gScale: gScale, gBright: gBright, gLift: gLift, gOn: gOn, k: 0.03, damp: 0.86 };
        for (var i = 0; i < N; i++) { var o = { x: 0, y: 0, z: 0 }; sph([0, 0, 0], 1.6 + Math.random() * 1.2, o); P[i * 3] = T[i * 3] = o.x; P[i * 3 + 1] = T[i * 3 + 1] = o.y; P[i * 3 + 2] = T[i * 3 + 2] = o.z; C[i * 3] = CT[i * 3] = 0.7; C[i * 3 + 1] = CT[i * 3 + 1] = 0.8; C[i * 3 + 2] = CT[i * 3 + 2] = 0.9; SZ[i] = 1.4; }
        var prog = null, buf = null, U = {};
        if (gl) {
          var mk = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
          var vs = mk(gl.VERTEX_SHADER, 'attribute vec2 aP;attribute vec4 aC;attribute float aS;uniform vec2 uR;varying vec4 vC;void main(){vec2 c=aP/uR*2.0-1.0;gl_Position=vec4(c.x,-c.y,0.0,1.0);gl_PointSize=max(1.0,aS);vC=aC;}');
          var fs = mk(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec4 vC;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d);float m=smoothstep(0.5,0.22,r)+smoothstep(0.2,0.0,r)*0.5;vec3 c=vC.rgb*vC.a*m;gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}');
          if (vs && fs) {
            prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
            if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
              gl.useProgram(prog); buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, BUF.byteLength, gl.DYNAMIC_DRAW);
              U.aP = gl.getAttribLocation(prog, 'aP'); U.aC = gl.getAttribLocation(prog, 'aC'); U.aS = gl.getAttribLocation(prog, 'aS'); U.uR = gl.getUniformLocation(prog, 'uR');
              gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(0, 0, 0, 0);
            } else { gl = null; }
          } else gl = null;
          if (!gl) c2 = gcv.getContext('2d');
        }
        var tmp = { x: 0, y: 0, z: 0 };
        // назначить частицам idx цели из набора частей; delay(i, o) -> задержка в секундах
        me.assign = function (idx, parts, delay, instant, shid) {
          shid = shid || 0;
          for (var k = 0; k < idx.length; k++) {
            var i = idx[k], pt = parts.pick(), b4 = i * 4; tmp.u = Math.random(); tmp.v = Math.random(); tmp.w = 0; tmp.q = 0; pt.gen(tmp);
            NUA[b4] = tmp.u; NUA[b4 + 1] = tmp.v; NUA[b4 + 2] = tmp.w; NUA[b4 + 3] = tmp.q; NSH[i] = shid;
            if (shid && me.dyn[shid]) me.dyn[shid](NUA, b4, me.t, tmp);
            var c = typeof pt.col === 'function' ? pt.col(tmp) : pt.col;
            NT[i * 3] = tmp.x; NT[i * 3 + 1] = tmp.y; NT[i * 3 + 2] = tmp.z; NC[i * 3] = c[0]; NC[i * 3 + 1] = c[1]; NC[i * 3 + 2] = c[2];
            NA[i] = pt.a * (0.75 + Math.random() * 0.25); NS[i] = pt.s * (Math.random() < 0.04 ? 2.4 : 1.55); NG[i] = tmp.g != null ? tmp.g : pt.g; tmp.g = null;
            SW[i] = env.rm || instant ? -1 : me.t + (delay ? delay(i, tmp, NG[i]) : 0) + 1e-4;
            if (env.rm || instant) apply(i);
          }
        };
        function apply(i) { var b4 = i * 4; UA[b4] = NUA[b4]; UA[b4 + 1] = NUA[b4 + 1]; UA[b4 + 2] = NUA[b4 + 2]; UA[b4 + 3] = NUA[b4 + 3]; SH[i] = NSH[i]; var j = i * 3; T[j] = NT[j]; T[j + 1] = NT[j + 1]; T[j + 2] = NT[j + 2]; CT[j] = NC[j]; CT[j + 1] = NC[j + 1]; CT[j + 2] = NC[j + 2]; AT[i] = NA[i]; SZ[i] = NS[i]; G[i] = NG[i]; SW[i] = 0; if (env.rm) { P[j] = T[j]; P[j + 1] = T[j + 1]; P[j + 2] = T[j + 2]; C[j] = CT[j]; C[j + 1] = CT[j + 1]; C[j + 2] = CT[j + 2]; A[i] = AT[i]; } }
        me.release = function () { try { var ex = gl && gl.getExtension('WEBGL_lose_context'); if (ex) ex.loseContext(); } catch (e) {} };
        me.snapAll = function () { for (var i = 0; i < N; i++) { var j = i * 3; P[j] = T[j]; P[j + 1] = T[j + 1]; P[j + 2] = T[j + 2]; V[j] = V[j + 1] = V[j + 2] = 0; C[j] = CT[j]; C[j + 1] = CT[j + 1]; C[j + 2] = CT[j + 2]; A[i] = AT[i]; } };
        me.all = function () { var a = []; for (var i = 0; i < N; i++) a.push(i); return a; };
        me.kick = function (idx, s) { for (var k = 0; k < idx.length; k++) { var j = idx[k] * 3; V[j] += rnd(-s, s); V[j + 1] += rnd(-s, s); V[j + 2] += rnd(-s, s); } };
        me.group = function (i) { return G[i]; };
        var rc = { cy: 1, sy: 0, cp: 1, sp: 0 };
        me.project = function (x, y, z, out) {
          var rx = x * rc.cy + z * rc.sy, rz0 = -x * rc.sy + z * rc.cy, ry = y * rc.cp - rz0 * rc.sp, rz = y * rc.sp + rz0 * rc.cp, f = D / (D - rz);
          out.x = me.cx + rx * f * me.S; out.y = me.cy - ry * f * me.S; out.f = f; out.z = rz; return out;
        };
        // дополнительные точки этого кадра (импульсы, искры)
        me.pt = function (x, y, z, c, a, s) {
          if (exN >= EXMAX) return;
          var q = me.project(x, y, z, pq), b = exN * 7; exN++;
          EX[b] = q.x; EX[b + 1] = q.y; EX[b + 2] = c[0]; EX[b + 3] = c[1]; EX[b + 4] = c[2]; EX[b + 5] = a; EX[b + 6] = s * q.f;
        };
        me.trail = function (fn, t, len, n, c, a, s) { for (var k = 0; k < n; k++) { var u = t - len * k / n; if (u < 0) break; fn(u, tmp); var fall = 1 - k / n; me.pt(tmp.x, tmp.y, tmp.z, c, a * fall * fall, (k === 0 ? s * 1.6 : s) * (0.6 + 0.4 * fall)); } };
        var pq = { x: 0, y: 0, f: 1, z: 0 };
        me.layout = function () {
          var hr = host.getBoundingClientRect(), pr = panel.getBoundingClientRect();
          me.W = Math.max(1, hr.width); me.H = Math.max(1, hr.height); me.dpr = Math.min(window.devicePixelRatio || 1, 2);
          gcv.width = Math.round(me.W * me.dpr); gcv.height = Math.round(me.H * me.dpr); ocv.width = gcv.width; ocv.height = gcv.height;
          me.panel = { x: pr.left - hr.left, y: pr.top - hr.top, w: pr.width, h: pr.height };
          if (me.onLayout) me.onLayout();
        };
        me.step = function (dt) {
          me.t += dt; exN = 0;
          var cam = me.cam, f60 = Math.min(3, dt * 60);
          var mx = me.mouse.x, my = me.mouse.y, hx = me.mouse.in ? clamp((mx - me.cx) / (me.W * 0.5), -1, 1) : 0, hy = me.mouse.in ? clamp((my - me.cy) / (me.H * 0.5), -1, 1) : 0;
          if (cam.hold) { cam.yaw += (cam.holdYaw + hx * 0.35 * cam.follow - cam.yaw) * Math.min(1, dt * 3); cam.pitch += (cam.holdPitch + hy * 0.25 * cam.follow - cam.pitch) * Math.min(1, dt * 3); }
          else { if (!env.rm) cam.yaw += cam.spin * dt; cam.tyaw += (hx * 0.6 * cam.follow - cam.tyaw) * Math.min(1, dt * 2.5); cam.tpitch += (hy * 0.35 * cam.follow - cam.tpitch) * Math.min(1, dt * 2.5); }
          var yaw = cam.yaw + (cam.hold ? 0 : cam.tyaw), pitch = cam.pitch + (cam.hold ? 0 : cam.tpitch);
          me.ya = yaw; me.pi = pitch; rc.cy = Math.cos(yaw); rc.sy = Math.sin(yaw); rc.cp = Math.cos(pitch); rc.sp = Math.sin(pitch);
          if (me.update) me.update(dt);
          var k = me.k * f60, damp = Math.pow(me.damp, f60), ca = Math.min(1, dt * 3.5), aa = Math.min(1, dt * 3), od = Math.pow(0.9, f60);
          var R = env.mob ? 55 : 85, R2 = R * R, n = 0, S = me.S, cxx = me.cx, cyy = me.cy, dpr = me.dpr;
          var dyn = me.dyn, tt = me.t;
          for (var i = 0; i < N; i++) {
            var j = i * 3;
            if (SW[i] > 0 && me.t >= SW[i]) apply(i);
            var df = dyn[SH[i]];
            if (df) {
              dout.b = 1; dout.snap = false; df(UA, i * 4, tt, dout); T[j] = dout.x; T[j + 1] = dout.y; T[j + 2] = dout.z; DB[i] = dout.b;
              if (dout.snap || env.rm) { P[j] = T[j]; P[j + 1] = T[j + 1]; P[j + 2] = T[j + 2]; V[j] = V[j + 1] = V[j + 2] = 0; }
            } else DB[i] = 1;
            if (!env.rm) {
              var vx = (V[j] + (T[j] - P[j]) * k) * damp, vy = (V[j + 1] + (T[j + 1] - P[j + 1]) * k) * damp, vz = (V[j + 2] + (T[j + 2] - P[j + 2]) * k) * damp;
              V[j] = vx; V[j + 1] = vy; V[j + 2] = vz; P[j] += vx * f60; P[j + 1] += vy * f60; P[j + 2] += vz * f60;
              C[j] += (CT[j] - C[j]) * ca; C[j + 1] += (CT[j + 1] - C[j + 1]) * ca; C[j + 2] += (CT[j + 2] - C[j + 2]) * ca;
              A[i] += (AT[i] - A[i]) * aa;
            }
            var g = G[i], sc = gScale[g], x = P[j] * sc, y = P[j + 1] + gLift[g], z = P[j + 2] * sc;
            var rx = x * rc.cy + z * rc.sy, rz0 = -x * rc.sy + z * rc.cy, ry = y * rc.cp - rz0 * rc.sp, rz = y * rc.sp + rz0 * rc.cp, ff = D / (D - rz);
            var sx = cxx + rx * ff * S, sy = cyy - ry * ff * S, o2 = i * 2;
            if (!env.rm) {
              var ex = sx + O[o2] - mx, ey = sy + O[o2 + 1] - my, e2 = ex * ex + ey * ey;
              if (e2 < R2) { var ed = Math.sqrt(e2) || 1, es = (1 - ed / R) * 2.2 * f60; O[o2] += ex / ed * es; O[o2 + 1] += ey / ed * es; }
              O[o2] *= od; O[o2 + 1] *= od;
            }
            var a = me.ab * A[i] * DB[i] * gBright[g] * gOn[g] * (0.42 + 0.58 * clamp((rz + 1.1) / 2.2, 0, 1));
            if (a < 0.01) continue;
            var b = n * 7; n++;
            BUF[b] = sx + O[o2]; BUF[b + 1] = sy + O[o2 + 1]; var tk = me.tk, lu = (C[j] * 0.3 + C[j + 1] * 0.5 + C[j + 2] * 0.2) * 1.18 * tk, tq = 1 - tk;
            BUF[b + 2] = C[j] * tq + me.tint[0] * lu; BUF[b + 3] = C[j + 1] * tq + me.tint[1] * lu; BUF[b + 4] = C[j + 2] * tq + me.tint[2] * lu; BUF[b + 5] = a; BUF[b + 6] = SZ[i] * ff * dpr * me.ps;
          }
          for (var e = 0; e < exN; e++) { var eb = e * 7, nb = n * 7; n++; BUF[nb] = EX[eb]; BUF[nb + 1] = EX[eb + 1]; BUF[nb + 2] = EX[eb + 2]; BUF[nb + 3] = EX[eb + 3]; BUF[nb + 4] = EX[eb + 4]; BUF[nb + 5] = EX[eb + 5]; BUF[nb + 6] = EX[eb + 6] * dpr; }
          draw(n);
          oc.setTransform(dpr, 0, 0, dpr, 0, 0); oc.clearRect(0, 0, me.W, me.H);
          if (me.overlay) me.overlay(oc);
        };
        function draw(n) {
          if (gl) {
            gl.viewport(0, 0, gcv.width, gcv.height); gl.clear(gl.COLOR_BUFFER_BIT);
            if (!n) return;
            gl.useProgram(prog); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, BUF.subarray(0, n * 7));
            gl.enableVertexAttribArray(U.aP); gl.vertexAttribPointer(U.aP, 2, gl.FLOAT, false, 28, 0);
            gl.enableVertexAttribArray(U.aC); gl.vertexAttribPointer(U.aC, 4, gl.FLOAT, false, 28, 8);
            gl.enableVertexAttribArray(U.aS); gl.vertexAttribPointer(U.aS, 1, gl.FLOAT, false, 28, 24);
            gl.uniform2f(U.uR, me.W, me.H); gl.drawArrays(gl.POINTS, 0, n);
          } else if (c2) {
            c2.setTransform(me.dpr, 0, 0, me.dpr, 0, 0); c2.clearRect(0, 0, me.W, me.H); c2.globalCompositeOperation = 'lighter';
            for (var q = 0; q < n; q++) { var b = q * 7, s = BUF[b + 6] / me.dpr; c2.fillStyle = 'rgba(' + (BUF[b + 2] * 255 | 0) + ',' + (BUF[b + 3] * 255 | 0) + ',' + (BUF[b + 4] * 255 | 0) + ',' + Math.min(1, BUF[b + 5]).toFixed(3) + ')'; c2.fillRect(BUF[b] - s / 2, BUF[b + 1] - s / 2, s, s); }
            c2.globalCompositeOperation = 'source-over';
          }
        }
        return me;
      }
      // общий запуск: размеры, цикл, мышь, пауза вне экрана
      function boot(root, makeScene) {
        var gcv = root.querySelector('[data-gl]'), ocv = root.querySelector('[data-ov]'), panel = root.querySelector('[data-panel]') || root.querySelector('[data-obj]');
        if (!gcv || !ocv || !panel) return null;
        var env = { rm: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), mob: (root.clientWidth || window.innerWidth) < 760, n: +(root.getAttribute('data-n') || 0) };
        var core = makeCore(root, gcv, ocv, panel, env), scene = makeScene(core, root, env);
        var raf = 0, alive = true, active = true, prev = performance.now();
        function frame(now) { var dt = Math.min(0.05, Math.max(0, (now - prev) / 1000)); prev = now; core.step(env.rm ? 0 : dt); }
        function loop(now) { raf = 0; if (!alive || !active) return; frame(now); if (!env.rm) raf = requestAnimationFrame(loop); }
        function start() { if (raf || !alive || !active) return; prev = performance.now(); raf = requestAnimationFrame(loop); }
        function onMove(e) { var r = root.getBoundingClientRect(); core.mouse.x = e.clientX - r.left; core.mouse.y = e.clientY - r.top; core.mouse.in = core.mouse.x > 0 && core.mouse.x < r.width && core.mouse.y > 0 && core.mouse.y < r.height; if (scene.onPointer) scene.onPointer(core.mouse.x, core.mouse.y); }
        function onOut(e) { if (!e.relatedTarget) { core.mouse.in = false; core.mouse.x = core.mouse.y = -1e5; if (scene.onPointer) scene.onPointer(-1e5, -1e5); } }
        function onResize() { env.mob = (root.clientWidth || window.innerWidth) < 760; if (env.n) env.mob = env.mob || false; core.layout(); if (env.rm) frame(performance.now()); }
        // Пересчёт — когда меняется размер секции или панели (ResizeObserver), а не на каждый resize окна: на телефоне адресная
        // строка при прокрутке меняет высоту окна, а панель «Кодекса» от неё не зависит (правка по TASK-perf.md, 1). Без
        // ResizeObserver — как раньше
        var ro = null, roKey = '';
        function sizeKey() { return root.clientWidth + 'x' + root.clientHeight + ':' + panel.clientWidth + 'x' + panel.clientHeight; }
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerdown', onMove, { passive: true });
        window.addEventListener('pointerout', onOut);
        core.layout(); if (scene.start) scene.start();
        if ('ResizeObserver' in window) {
          roKey = sizeKey();
          ro = new ResizeObserver(function () { var k = sizeKey(); if (k === roKey || !alive) return; roKey = k; onResize(); });
          ro.observe(root); ro.observe(panel);
        } else window.addEventListener('resize', onResize);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (alive) { core.layout(); if (scene.fonts) scene.fonts(); } });
        frame(performance.now()); start();
        return {
          scene: scene, core: core,
          setActive: function (v) { active = v; if (v) start(); },
          destroy: function () {
            alive = false; if (raf) cancelAnimationFrame(raf); if (scene.destroy) scene.destroy(); core.release();
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onMove);
            window.removeEventListener('pointerout', onOut); window.removeEventListener('resize', onResize); if (ro) ro.disconnect();
          }
        };
      }
      // ===== Hero УТП: 5 принципов × 3 подачи (IT, люкс, IT + люкс) =====
      var TAU = 6.283185307;
      function fr(x) { return x - Math.floor(x); }
      function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
      function mRy(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
      function mRx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
      function mMul(A, B) { var R = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; }
      function mApply(M, x, y, z, o) { o.x = M[0] * x + M[1] * y + M[2] * z; o.y = M[3] * x + M[4] * y + M[5] * z; o.z = M[6] * x + M[7] * y + M[8] * z; }
      function mAxis(v, a) {
        var l = Math.hypot(v[0], v[1], v[2]), x = v[0] / l, y = v[1] / l, z = v[2] / l, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
        return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
      }
      function crv(arr, t) {
        var n = arr.length - 1, x = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
        var p0 = arr[Math.max(0, i - 1)], p1 = arr[i], p2 = arr[i + 1], p3 = arr[Math.min(n, i + 2)];
        return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
      }
      function wrapA(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
      function hsh(s, k) { return fr(Math.sin(s * 127.1 + k * 311.7) * 43758.5453); }
      var FONT = {
        '0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110', '2': '01110100010000100010001000100011111',
        '3': '11111000100010000010000011000101110', '4': '00010001100101010010111110001000010', '5': '11111100001111000001000011000101110',
        '6': '00110010001000011110100011000101110', '7': '11111000010001000100010000100001000', '8': '01110100011000101110100011000101110',
        '9': '01110100011000101111000010001001100', 'P': '11110100011000111110100001000010000', 'R': '11110100011000111110101001001010001',
        'I': '01110001000010000100001000010001110', 'V': '10001100011000110001100010101000100', 'A': '01110100011000111111100011000110001',
        'T': '11111001000010000100001000010000100', 'E': '11111100001000011110100001000011111', 'H': '10001100011000111111100011000110001',
        'X': '10001100010101000100010101000110001', 'K': '10001100101010011000101001001010001', 'D': '11110100011000110001100011000111110'
      };
      var PRIN = ['Холодный расчёт', 'Точность', 'Скорость', 'Защита данных', 'Дизайн'], VARS = ['IT', 'Люкс', 'IT + люкс'];

      function makeShapes(core, env) {
        var L = [];
        function add(p, v, d) { d.p = p; d.v = v; L.push(d); }
        function mouseModel() { return { x: (core.mouse.x - core.cx) / core.S, y: -(core.mouse.y - core.cy) / core.S }; }

        // 1B Люкс — хрустальный ферзь на токарном станке
        (function () {
          var PR = [0.4, 0.42, 0.33, 0.29, 0.22, 0.18, 0.155, 0.14, 0.13, 0.125, 0.128, 0.15, 0.2, 0.15, 0.21, 0.27], Y0 = -0.86, Y1 = 0.6, RS = 0.45;
          var stT = 0, cut = -0.9, sparks = [], rays = 0, tgt = [0.76, 0.76], tgtT = 0, tglow = 0, SQ = 0.38;
          function prof(y) { return crv(PR, (y - Y0) / (Y1 - Y0)); }
          var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
          // ход — не дальше двух клеток: дальняя клетка на узкой панели уходила за её край, прямо на текст
          function newTarget() { var d = DIRS[Math.floor(Math.random() * 8)], n = 1 + Math.floor(Math.random() * 2); tgt = [d[0] * n * SQ, d[1] * n * SQ]; }
          add(0, 1, {
            key: 'queen', name: 'Хрустальный ферзь', idea: 'Шахматный расчёт: фигура выточена точно по чертежу, ходы просчитаны на несколько шагов вперёд.',
            pitch: 0.3, spin: 0.15, sc: 0.95, k: 0.12,
            build: function (P) {
              P.add(0.5, function (o) { o.u = Y0 + (Y1 - Y0) * (Math.floor(Math.random() * 64) + 0.5) / 64; o.v = Math.random() * TAU; o.q = 0; }, function (o) { return mix3(COL.glass, iri(0.1 + (o.u - Y0) * 0.4), 0.35); }, 0, 0.85);
              P.add(0.14, function (o) { o.u = rnd(Y0, Y1); o.v = Math.floor(Math.random() * 16) * TAU / 16; o.q = 1; }, COL.frost, 0, 0.7);
              P.add(0.07, function (o) { o.u = Math.floor(Math.random() * 6 + 0.5) / 6; o.v = Math.random() * TAU; o.q = 2; }, COL.frost, 0, 0.8);
              P.add(0.06, function (o) { o.u = Math.floor(Math.random() * 8) * TAU / 8; o.v = Math.random(); o.w = Math.random(); o.q = 3; }, COL.frost, 0, 1);
              P.add(0.03, function (o) { var h = { x: 0, y: 0, z: 0 }; sph([0, 0, 0], 0.06, h); o.u = h.x; o.v = h.y; o.w = h.z; o.q = 4; }, COL.frost, 0, 1);
              P.add(0.15, function (o) { var ln = Math.floor(Math.random() * 6) - 3; o.u = ln * SQ + SQ / 2; o.v = rnd(-1.25, 1.25); o.w = Math.random() < 0.5 ? 0 : 1; o.q = 5; }, COL.glass, 0, 0.45);
              P.add(0.05, function (o) { var s = Math.floor(Math.random() * 4), t = rnd(-1, 1) * SQ / 2, h = SQ / 2; o.u = s === 0 ? t : (s === 1 ? t : (s === 2 ? -h : h)); o.v = s === 0 ? -h : (s === 1 ? h : t); o.q = 6; }, COL.mint, 0, 1);
            },
            f: function (A, i, t, o) {
              var q = A[i + 3], y, r, th;
              if (q < 2) { y = A[i]; th = A[i + 1]; var on = y <= cut; r = on ? prof(y) : RS; o.x = r * Math.cos(th); o.z = r * Math.sin(th); o.y = y; o.b = on ? 1 : 0.28; if (Math.abs(y - cut) < 0.02) o.b = 2.2; }
              else if (q < 3) { var rr = A[i] * 0.26; th = A[i + 1]; o.x = rr * Math.cos(th); o.z = rr * Math.sin(th); o.y = 0.585 + 0.08 * (1 - A[i] * A[i]); o.b = cut > 0.62 ? 1 : 0; }
              else if (q < 4) { th = A[i]; var sp = A[i + 1], rr2 = 0.27 + 0.02 * sp; o.x = rr2 * Math.cos(th) + A[i + 2] * 0.01; o.z = rr2 * Math.sin(th); o.y = 0.6 + sp * 0.09; o.b = cut > 0.64 ? 1 : 0; }
              else if (q < 5) { o.x = A[i]; o.y = 0.74 + A[i + 1]; o.z = A[i + 2]; o.b = cut > 0.7 ? 1 : 0; }
              else if (q < 6) { var lx = A[i], lz = A[i + 1]; if (A[i + 2] > 0.5) { o.x = lz; o.z = lx; } else { o.x = lx; o.z = lz; } o.y = -0.88; o.b = 1 - sstep(0.75, 1.25, Math.hypot(o.x, o.z)); }
              else { o.x = tgt[0] + A[i]; o.z = tgt[1] + A[i + 1]; o.y = -0.875; o.b = tglow * (1 - sstep(0.85, 1.3, Math.hypot(tgt[0], tgt[1]))); }
            },
            enter: function () { stT = core.t; sparks = []; },
            upd: function (dt, e) {
              var tau = core.t - stT, k;
              if (tau < 2.8) cut = -0.9 + 1.75 * ease(tau / 2.8); else if (tau < 10) cut = 0.85; else if (tau < 10.6) cut = 0.85 - 1.75 * ease((tau - 10) / 0.6); else { stT = core.t; }
              if (env.rm) { cut = 0.85; tglow = 1; return; }
              if (tau < 2.8) for (k = 0; k < 5; k++) { var a = Math.random() * TAU; sparks.push({ x: RS * Math.cos(a), y: cut, z: RS * Math.sin(a), vx: -Math.sin(a) * rnd(0.5, 1.4) + Math.cos(a) * 0.3, vy: rnd(0, 0.6), vz: Math.cos(a) * rnd(0.5, 1.4) + Math.sin(a) * 0.3, l: 1 }); }
              for (k = sparks.length - 1; k >= 0; k--) { var s = sparks[k]; s.l -= dt * 1.6; if (s.l <= 0) { sparks.splice(k, 1); continue; } s.vy -= dt * 1.5; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; core.pt(s.x, s.y, s.z, COL.frost, s.l, 2.4); }
              if (tau > 3) {
                rays += dt * (0.9 + 1.6 * e);
                for (k = 0; k < 8; k++) { var d = DIRS[k], n = Math.hypot(d[0], d[1]); (function (dx, dz) { core.trail(function (u, o) { o.x = dx * u; o.z = dz * u; o.y = -0.875; }, 0.45 + fr(rays + k * 0.13) * 1.0, 0.3, 10, COL.ice, 0.8, 2.2); })(d[0] / n, d[1] / n); }
                tgtT += dt * (1 + 1.5 * e); if (tgtT > 2.2) { tgtT = 0; newTarget(); }
              }
              tglow += ((tau > 3.2 && tau < 10 ? 1 : 0) - tglow) * Math.min(1, dt * 3);
            }
          });
        })();

        // 2C IT + люкс — оптический прицел
        (function () {
          var RR = [0.95, 0.77, 0.6], AXS = [[1, 0.25, 0.1], [0.15, 1, 0.35], [0.5, -0.45, 1]], W = [0.95, -1.25, 1.6];
          var ang = [0.6, 2.1, -1.3], lockA = [0, 0, 0], lockU = [0, 0, 0], locking = [false, false, false], MS = [], st = 'tumble', stT = 0, conv = 0, ax = 0, ay = 0, flashT = -9, cross = 0;
          for (var k = 0; k < 3; k++) MS.push(mAxis(AXS[k], ang[k]));
          function go(s) { st = s; stT = core.t; }
          add(1, 2, {
            key: 'scope', name: 'Оптический прицел', idea: 'Три шкалы сходятся в одну плоскость, луч — в одну точку. Наведи — прицел возьмёт курсор.',
            pitch: 0.06, sway: 0.25, sc: 1, k: 0.16,
            build: function (P) {
              RR.forEach(function (R, k) {
                P.add(R * 1.2, function (o) { var a = Math.random() * TAU, rr = R + (Math.random() < 0.5 ? -0.012 : 0.012); o.u = rr * Math.cos(a); o.v = rr * Math.sin(a); o.w = 0; o.q = k; }, k === 0 ? COL.frost : (k === 1 ? COL.az : COL.lil), 0, 0.95);
                P.add(R * 0.7, function (o) { var n = Math.floor(Math.random() * 72), a = n * TAU / 72, l = n % 6 === 0 ? 0.075 : 0.035, rr = R - 0.014 - Math.random() * l; o.u = rr * Math.cos(a); o.v = rr * Math.sin(a); o.w = 0; o.q = k; }, COL.ice, 0, 0.85);
              });
              P.add(0.35, function (o) {
                var s = Math.random(), hz = Math.random() < 0.5, d = (Math.random() < 0.5 ? -1 : 1) * rnd(0.07, 0.56);
                if (s < 0.85) { o.u = hz ? d : 0; o.v = hz ? 0 : d; }
                else { var m = (Math.floor(Math.random() * 5) + 1) * 0.1 * (Math.random() < 0.5 ? -1 : 1), h = { x: 0, y: 0, z: 0 }; sph([0, 0, 0], 0.012, h); o.u = (hz ? m : 0) + h.x; o.v = (hz ? 0 : m) + h.y; }
                o.w = 0.01; o.q = 3; o.g = 1;
              }, COL.frost, 1, 0.9);
              P.add(0.45, function (o) { var h = { x: 0, y: 0, z: 0 }; sph([0, 0, 0], rnd(0.9, 1.4), h); o.u = h.x; o.v = h.y; o.w = h.z; o.q = 4; o.g = 2; }, function () { return Math.random() < 0.5 ? COL.ice : COL.frost; }, 2, 0.6);
            },
            f: function (A, i, t, o) {
              var q = A[i + 3];
              if (q < 3) { mApply(MS[q | 0], A[i], A[i + 1], A[i + 2], o); }
              else if (q < 4) { o.x = A[i]; o.y = A[i + 1]; o.z = A[i + 2]; }
              else { var c = ease(conv), j = 0.012; o.x = A[i] * (1 - c) + A[i] * j * c; o.y = A[i + 1] * (1 - c) + A[i + 1] * j * c; o.z = A[i + 2] * (1 - c); o.b = 0.45 + 1.1 * c; }
              o.x += ax; o.y += ay;
            },
            enter: function () { go('tumble'); conv = 0; cross = 0; for (var k = 0; k < 3; k++) locking[k] = false; },
            upd: function (dt, e) {
              var t = core.t - stT, k;
              if (st === 'tumble') { for (k = 0; k < 3; k++) ang[k] += W[k] * dt * (1 + e); if (t > 2.2) { go('lock'); for (k = 0; k < 3; k++) { locking[k] = false; lockU[k] = 0; } } }
              else if (st === 'lock') {
                var done = 0;
                for (k = 0; k < 3; k++) {
                  if (t < k * 0.35) { ang[k] += W[k] * dt; continue; }
                  if (!locking[k]) { locking[k] = true; lockA[k] = wrapA(ang[k]); }
                  lockU[k] = clamp((t - k * 0.35) / 0.8, 0, 1); ang[k] = lockA[k] * (1 - ease(lockU[k])); if (lockU[k] >= 1) done++;
                }
                if (done === 3) { go('aim'); flashT = core.t + 0.6; }
              } else if (st === 'aim') {
                conv = Math.min(1, conv + dt / 0.6); cross = Math.min(1, cross + dt * 2);
                if (t > 3.2 && e < 0.5) go('release');
              } else if (st === 'release') {
                conv = Math.max(0, conv - dt / 0.35); cross = Math.max(0, cross - dt * 3);
                for (k = 0; k < 3; k++) ang[k] += W[k] * dt * Math.min(1, t * 2);
                if (t > 0.6) go('tumble');
              }
              for (k = 0; k < 3; k++) MS[k] = mAxis(AXS[k], ang[k]);
              core.gBright[1] = cross;
              var tx = 0, ty = 0;
              if (st === 'aim' && e > 0.3) { var mm = mouseModel(), d = Math.hypot(mm.x, mm.y), lim = 0.32; tx = d > lim ? mm.x / d * lim : mm.x; ty = d > lim ? mm.y / d * lim : mm.y; }
              ax += (tx - ax) * Math.min(1, dt * 4); ay += (ty - ay) * Math.min(1, dt * 4);
              if (!env.rm && core.t > flashT && core.t < flashT + 0.6) { var u = (core.t - flashT) / 0.6; for (k = 0; k < 48; k++) { var a = k * TAU / 48; core.pt(ax + Math.cos(a) * u * 0.45, ay + Math.sin(a) * u * 0.45, 0.02, COL.frost, 1 - u, 3); } }
              if (!env.rm && st === 'aim') core.pt(ax, ay, 0.03, COL.frost, 0.8 + 0.2 * Math.sin(core.t * 8), 7);
            },
            reset: function () { core.gBright[1] = 1; }
          });
        })();

        // 3C IT + люкс — кольцевой ускоритель
        (function () {
          var RG = 0.82, NB = 5, PHI = 200, sp = 0.6, cyc = 0, sparks = [], burst = false;
          add(2, 2, {
            key: 'collider', name: 'Ускоритель', idea: 'Разгон по рассчитанной траектории — до вспышки результата. Наведи — разгоним сильнее.',
            pitch: 0.42, spin: 0.08, sc: 1, k: 0.2,
            build: function (P) {
              P.add(0.36, function (o) { var b = Math.random() < 0.5 ? 0 : 1, k = Math.floor(Math.random() * NB), g = (Math.random() + Math.random() + Math.random() - 1.5) * 0.045; o.u = k * TAU / NB + g; o.v = rnd(-0.012, 0.012); o.w = rnd(-0.012, 0.012); o.q = 10 + b; }, function (o) { return o.q > 10 ? COL.lil : COL.ice; }, 0, 1);
              P.add(0.22, function (o) { var a = Math.random() * TAU, b = Math.random() * TAU, r = 0.03; o.u = (RG + r * Math.cos(b)) * Math.cos(a); o.v = r * Math.sin(b); o.w = (RG + r * Math.cos(b)) * Math.sin(a); o.q = -1; }, COL.glass, 0, 0.4);
              P.add(0.26, function (o) {
                var k = Math.floor(Math.random() * 20), a = (k + 0.5) * TAU / 20; if (Math.abs(wrapA(a)) < 0.25 || Math.abs(wrapA(a - Math.PI)) < 0.25) a += TAU / 40;
                var E = [[-1, -1, -1, 1, -1, -1], [-1, 1, -1, 1, 1, -1], [-1, -1, 1, 1, -1, 1], [-1, 1, 1, 1, 1, 1], [-1, -1, -1, -1, 1, -1], [1, -1, -1, 1, 1, -1], [-1, -1, 1, -1, 1, 1], [1, -1, 1, 1, 1, 1], [-1, -1, -1, -1, -1, 1], [1, -1, -1, 1, -1, 1], [-1, 1, -1, -1, 1, 1], [1, 1, -1, 1, 1, 1]][Math.floor(Math.random() * 12)], s = Math.random();
                var lt = (E[0] + (E[3] - E[0]) * s) * 0.075, ly = (E[1] + (E[4] - E[1]) * s) * 0.065, ln = (E[2] + (E[5] - E[2]) * s) * 0.075;
                var tx = -Math.sin(a), tz = Math.cos(a), nx = Math.cos(a), nz = Math.sin(a);
                o.u = RG * nx + tx * lt + nx * ln; o.v = ly; o.w = RG * nz + tz * lt + nz * ln; o.q = -1; o.g = k & 1;
              }, function (o) { return o.g ? COL.lil : COL.az; }, 0, 0.6);
              P.add(0.16, function (o) {
                var a = Math.random() < 0.5 ? 0 : Math.PI, rr = [0.12, 0.19, 0.26][Math.floor(Math.random() * 3)], al = rnd(-0.17, 0.17), b = Math.random() * TAU, ring = Math.random() < 0.6;
                if (ring) al = (Math.floor(Math.random() * 5) - 2) * 0.085; else b = Math.floor(Math.random() * 12) * TAU / 12;
                var tx = -Math.sin(a), tz = Math.cos(a), nx = Math.cos(a), nz = Math.sin(a);
                o.u = RG * nx + tx * al + nx * rr * Math.cos(b); o.v = rr * Math.sin(b); o.w = RG * nz + tz * al + nz * rr * Math.cos(b); o.q = -1;
              }, COL.frost, 0, 0.5);
            },
            f: function (A, i, t, o) {
              var q = A[i + 3];
              if (q < 0) { o.x = A[i]; o.y = A[i + 1]; o.z = A[i + 2]; return; }
              var an = (q > 10 ? -PHI : PHI) + A[i], r = RG + A[i + 2]; o.x = r * Math.cos(an); o.z = r * Math.sin(an); o.y = A[i + 1];
            },
            enter: function () { cyc = 0; sparks = []; },
            upd: function (dt, e) {
              cyc += dt * (1 + 0.5 * e); var tau = cyc % 7;
              if (tau < 5.4) { sp = 0.6 + 9.5 * (1 + 0.5 * e) * Math.pow(tau / 5.4, 3); burst = false; }
              else { if (!burst) { burst = true; if (!env.rm) [0, Math.PI].forEach(function (a) { for (var k = 0; k < 70; k++) { var h = { x: 0, y: 0, z: 0 }; sph([0, 0, 0], 1, h); var v = rnd(0.4, 1.4); sparks.push({ x: RG * Math.cos(a), y: 0, z: RG * Math.sin(a), vx: h.x * v, vy: h.y * v, vz: h.z * v, l: 1, c: [COL.frost, COL.mint, COL.ice][k % 3] }); } }); } sp += (0.6 - sp) * Math.min(1, dt * 2.2); }
              PHI += sp * dt;
              if (env.rm) return;
              for (var b = 0; b < 2; b++) for (var k = 0; k < NB; k++) (function (dir, off) {
                core.trail(function (u, o) { var an = dir > 0 ? u : -u; o.x = RG * Math.cos(an); o.z = RG * Math.sin(an); o.y = 0; }, dir > 0 ? PHI + off : PHI - off, Math.min(2.2, 0.035 * sp + 0.05), 18, dir > 0 ? COL.ice : COL.lil, 0.9, 2.4);
              })(b ? -1 : 1, k * TAU / NB);
              for (k = sparks.length - 1; k >= 0; k--) { var s = sparks[k]; s.l -= dt * 1.1; if (s.l <= 0) { sparks.splice(k, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; core.pt(s.x, s.y, s.z, s.c, s.l, 2.6); }
            }
          });
        })();

        // 4A IT — шифровальные роторы
        (function () {
          var WORD = 'DATA', PX = 0.026, RX = [-0.3, 0, 0.3], RRAD = 0.42, pix = [], W = (WORD.length * 6 - 1) * PX, LX0 = -0.85 - W / 2, st = 'plain', stT = 0, G = 0, glow = 1, rot = [0, 0, 0];
          for (var k = 0; k < WORD.length; k++) { var bm = FONT[WORD[k]]; for (var p = 0; p < 35; p++) if (bm[p] === '1') pix.push([LX0 + (k * 6 + p % 5) * PX, (3 - Math.floor(p / 5)) * PX]); }
          function go(s) { st = s; stT = core.t; }
          function stepE(x) { var f = Math.floor(x); return f + sstep(0.55, 1, x - f); }
          add(3, 0, {
            key: 'rotors', name: 'Шифровальные роторы', idea: 'Данные проходят роторы и превращаются в шум. Собрать их обратно может только ключ. Наведи — расшифровка.',
            pitch: 0.12, sway: 0.2, yaw0: 0.5, sc: 0.8, k: 0.18,
            build: function (P) {
              P.add(0.5, function (o) { var n = Math.floor(Math.random() * pix.length); o.u = n; o.v = Math.random(); o.w = rnd(-0.004, 0.004); o.q = 0; }, function () { return Math.random() < 0.6 ? mix3(COL.ice, COL.frost, 0.4) : COL.mint; }, 0, 1);
              RX.forEach(function (rx, k) {
                P.add(0.1, function (o) { o.u = RRAD; o.v = Math.random() * TAU; o.w = Math.random() < 0.5 ? -0.025 : 0.025; o.q = 1 + k; }, COL.frost, 1, 0.85);
                P.add(0.05, function (o) { o.u = Math.random() < 0.5 ? 0.3 : 0.06; o.v = Math.random() * TAU; o.w = 0.025; o.q = 1 + k; }, COL.az, 1, 0.7);
                P.add(0.05, function (o) { var n = Math.floor(Math.random() * 26); o.u = rnd(0.32, 0.39); o.v = n * TAU / 26; o.w = 0.03; o.q = 1 + k; }, COL.ice, 1, 0.9);
              });
              P.add(0.08, function (o) {
                var s = Math.random();
                if (s < 0.25) { o.u = rnd(-0.45, 0.45); o.v = 0; o.w = 0; }
                else if (s < 0.6) { var e = Math.random() * 4, f = fr(e), x0 = LX0 - 0.06, x1 = LX0 + W + 0.06, y0 = -0.16, y1 = 0.16; if (e < 1) { o.u = x0 + (x1 - x0) * f; o.v = y0; } else if (e < 2) { o.u = x0 + (x1 - x0) * f; o.v = y1; } else if (e < 3) { o.u = x0; o.v = y0 + (y1 - y0) * f; } else { o.u = x1; o.v = y0 + (y1 - y0) * f; } o.w = 0; if (Math.abs(o.u - x0) > 0.05 && Math.abs(o.u - x1) > 0.05 && e < 2) o.u = Math.random() < 0.5 ? x0 + rnd(0, 0.05) : x1 - rnd(0, 0.05); }
                else { var e2 = Math.random() * 12, f2 = fr(e2), X = [0.6, 1.12], Y = [-0.27, 0.27], Z = [-0.22, 0.22], ax = Math.floor(e2 / 4), c1 = (Math.floor(e2) & 1), c2 = (Math.floor(e2) & 2) >> 1; var pts = [X, Y, Z]; var v = [0, 0, 0]; v[ax] = pts[ax][0] + (pts[ax][1] - pts[ax][0]) * f2; v[(ax + 1) % 3] = pts[(ax + 1) % 3][c1]; v[(ax + 2) % 3] = pts[(ax + 2) % 3][c2]; o.u = v[0]; o.v = v[1]; o.w = v[2]; }
                o.q = 9;
              }, COL.glass, 2, 0.45);
            },
            f: function (A, i, t, o) {
              var q = A[i + 3];
              if (q >= 9) { o.x = A[i]; o.y = A[i + 1]; o.z = A[i + 2]; return; }
              if (q >= 1) { var k = (q | 0) - 1, th = A[i + 1] + rot[k], r = A[i]; o.x = RX[k] + A[i + 2]; o.y = r * Math.cos(th); o.z = r * Math.sin(th); return; }
              var px = pix[A[i] | 0], sd = A[i + 1], lx = px[0], ly = px[1], d = (LX0 + W - lx) / W * 0.55, pr = ease(clamp(G - d, 0, 1));
              var sx = 0.62 + hsh(sd, 1) * 0.48, x = lx + (sx - lx) * pr, y = ly, z = 0;
              for (var j = 0; j < 3; j++) {
                var w = sstep(RX[j] - 0.035, RX[j] + 0.035, x), ty, tz;
                if (j < 2) { var rr = 0.32 * Math.sqrt(hsh(sd, 2 + j * 2)), aa = hsh(sd, 3 + j * 2) * TAU; ty = rr * Math.cos(aa); tz = rr * Math.sin(aa); } else { ty = (hsh(sd, 8) - 0.5) * 0.5; tz = (hsh(sd, 9) - 0.5) * 0.4; }
                y += (ty - y) * w; z += (tz - z) * w;
              }
              var cz = sstep(0.55, 0.6, x); y += Math.sin(t * 7 + sd * 50) * 0.008 * cz; z += Math.cos(t * 6 + sd * 40) * 0.008 * cz;
              o.x = x; o.y = y; o.z = z + A[i + 2]; o.b = x < RX[0] ? 1 + glow * 0.9 : 0.62;
            },
            enter: function () { go('plain'); G = 0; glow = 1; },
            upd: function (dt, e) {
              var t = core.t - stT;
              if (st === 'plain') { G = 0; if (t > 1.8 && e < 0.5) go('enc'); }
              else if (st === 'enc') { G = Math.min(1.55, t / 2.2 * 1.55); if (t > 2.3) go('cipher'); }
              else if (st === 'cipher') { G = 1.55; if (t > 1.6 || (e > 0.5 && t > 0.2)) go('dec'); }
              else if (st === 'dec') { G = Math.max(0, 1.55 - t / 2.2 * 1.55); if (t > 2.3) { go('plain'); glow = 1; } }
              glow = Math.max(0, glow - dt * 0.5);
              var s0 = G / 1.55 * 13; rot[0] = stepE(s0) * TAU / 26; rot[1] = stepE(s0 / 4) * TAU / 26; rot[2] = stepE(s0 / 13) * TAU / 26;
              core.gBright[1] = 1 + (st === 'enc' || st === 'dec' ? 0.5 : 0);
            }
          });
        })();


        // 5 Дизайн — перо рисует бриллиант. Как в мастерской: тонкий пунктир построения (ось, рундист, площадка),
        // потом пером с нажимом — контур и грани (толщина зависит от направления штриха, у кончика блестят свежие
        // чернила), потом размеры. Перо уходит в сторону, чертёж отрывается от листа и встаёт объёмным бриллиантом,
        // который вращается и искрится; сам чертёж остаётся на бумаге. Линия появляется только там, где прошло перо.
        // Курсор над панелью забирает перо — можно рисовать самому, а чертёж ждёт, пока перо вернётся на место.
        (function () {
          var Y0 = -0.32, K = 1, YC = -0.16, RG = 0.64, RT = 0.34, YT = 0.26, YCU = -0.58;
          // ---- бриллиант (круглая огранка, упрощённо) в 3D: ось — y, площадка сверху ----
          var VT = [], VG = [], VC = [0, YCU, 0], E3 = [], VX = [], k;
          for (k = 0; k < 8; k++) { var a8 = Math.PI / 8 + k * Math.PI / 4; VT.push([RT * Math.cos(a8), YT, RT * Math.sin(a8)]); }
          for (k = 0; k < 16; k++) { var a16 = k * Math.PI / 8; VG.push([RG * Math.cos(a16), 0, RG * Math.sin(a16)]); }
          for (k = 0; k < 8; k++) E3.push([VT[k], VT[(k + 1) % 8]]);                                        // площадка
          for (k = 0; k < 16; k++) E3.push([VG[k], VG[(k + 1) % 16]]);                                       // рундист
          for (k = 0; k < 8; k++) { var gm = VG[(2 * k + 2) % 16]; E3.push([VT[k], gm]); E3.push([VT[(k + 1) % 8], gm]); } // корона
          for (k = 0; k < 8; k++) E3.push([VG[2 * k], VC]);                                                  // павильон
          VX = VT.concat(VG.filter(function (v, j) { return j % 2 === 0; })).concat([VC]);                    // где вспыхивают искры
          // ---- чертёж — вид бриллианта спереди на листе. Лист — плоскость y = Y0, «вверх» на листе — это −z ----
          function P2(x, y) { return [x * K, -(y - YC) * K]; }
          var XT1 = RT * Math.cos(Math.PI / 8), XT2 = RT * Math.cos(3 * Math.PI / 8), XG2 = RG * Math.cos(Math.PI / 4);
          var gT1 = P2(-XT1, YT), gT2 = P2(XT1, YT), gTa = P2(-XT2, YT), gTb = P2(XT2, YT), gL = P2(-RG, 0), gR = P2(RG, 0), gA = P2(-XG2, 0), gB = P2(XG2, 0), gM = P2(0, 0), gC = P2(0, YCU);
          function arc(cx, cy, r, a0, a1) { var o = []; for (var j = 0; j <= 12; j++) { var a = a0 + (a1 - a0) * j / 12; o.push(P2(cx + r * Math.cos(a), cy + r * Math.sin(a))); } return o; }
          // порядок — как рисуют руками и чтобы перо меньше летало впустую: построение, контур против часовой стрелки
          // и без отрыва — грани короны, рундист, павильон, потом углы и размер площадки
          var DY = YT + 0.13, STROKES = [
            { k: 'guide', dash: [0.05, 0.022, 0.008, 0.022], pts: [P2(0, YT + 0.1), P2(0, YCU - 0.1)] },        // ось
            { k: 'guide', dash: [0.045, 0.022], pts: [P2(RG + 0.2, 0), P2(-RG - 0.2, 0)] },                     // рундист
            { k: 'guide', dash: [0.045, 0.022], pts: [P2(-XT1 - 0.12, YT), P2(XT1 + 0.12, YT)] },               // площадка
            { k: 'ink', pts: [gT2, gT1, gL, gC, gR, gT2] },                                                     // контур
            { k: 'ink', pts: [gT2, gB, gTb, gM, gTa, gA, gT1] },                                                // грани короны
            { k: 'ink', pts: [gL, gR] },                                                                         // рундист
            { k: 'ink', pts: [gB, gC, gA] },                                                                     // грани павильона
            { k: 'ink', pts: [gM, gC] },
            { k: 'dim', pts: arc(RG, 0, 0.2, Math.PI + Math.atan2(-YCU, RG), Math.PI) },                        // угол павильона
            { k: 'dim', pts: arc(-RG, 0, 0.2, 0, Math.atan2(YT, RG - XT1)) },                                   // угол короны
            { k: 'dim', pts: [P2(-XT1, YT + 0.04), P2(-XT1, DY + 0.03)] },                                      // выносные линии
            { k: 'dim', pts: [P2(-XT1 - 0.04, DY), P2(XT1 + 0.04, DY)] },                                       // размер площадки
            { k: 'dim', pts: [P2(XT1, DY + 0.03), P2(XT1, YT + 0.04)] },
            { k: 'dim', pts: [P2(XT1 - 0.022, DY - 0.022), P2(XT1 + 0.022, DY + 0.022)] },                      // засечки
            { k: 'dim', pts: [P2(-XT1 + 0.022, DY + 0.022), P2(-XT1 - 0.022, DY - 0.022)] }
          ];
          // ---- маршрут пера: штрихи (рисует) и перелёты (над листом); скорость, см/с модели ----
          var V = { guide: 5, ink: 2.9, dim: 5 }, VAIR = 6.5, START = [0.3, -0.78], REST = [0.98, 0.3];
          var SEG = [], DS = [], INK = [], GDS = [], TT = 0, LD = 0, last = START;
          function air(a, b) { var l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-4) return; var dt = l / VAIR + 0.04; SEG.push({ a: a, b: b, len: l, k: 'air', t0: TT, dt: dt, d0: LD }); TT += dt; }
          STROKES.forEach(function (st) {
            air(last, st.pts[0]);
            for (var j = 0, s0 = 0; j + 1 < st.pts.length; j++) {
              var a = st.pts[j], b = st.pts[j + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-5) continue;
              var ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
              // перо с широким кончиком под 45°: штрих поперёк кончика — толстый, вдоль — тонкий
              var sg = { a: a, b: b, len: l, k: st.k, dash: st.dash, t0: TT, dt: l / V[st.k], d0: LD, s0: s0, nx: -(b[1] - a[1]) / l, nz: (b[0] - a[0]) / l,
                w: st.k === 'ink' ? 0.003 + 0.019 * Math.abs(Math.sin(ang - Math.PI / 4)) : 0.003 };
              SEG.push(sg); DS.push(sg); (st.k === 'ink' ? INK : GDS).push(sg); TT += sg.dt; LD += l; s0 += l;
            }
            last = st.pts[st.pts.length - 1];
          });
          air(last, REST);
          var TDRAW = TT, LIFT0 = TT + 0.35, LIFTD = 1.6;
          function atLen(u, o) { for (var j = 0; j < DS.length; j++) { var s = DS[j]; if (u <= s.d0 + s.len || j === DS.length - 1) { var f = clamp((u - s.d0) / s.len, 0, 1); o.x = s.a[0] + (s.b[0] - s.a[0]) * f; o.z = s.a[1] + (s.b[1] - s.a[1]) * f; return s; } } return DS[0]; }
          function penAt(t, o) {
            for (var j = 0; j < SEG.length; j++) { var s = SEG[j]; if (t <= s.t0 + s.dt || j === SEG.length - 1) { var f = clamp((t - s.t0) / s.dt, 0, 1); if (s.k === 'air') f = ease(f); o.x = s.a[0] + (s.b[0] - s.a[0]) * f; o.z = s.a[1] + (s.b[1] - s.a[1]) * f; o.air = s.k === 'air'; o.ink = s.k === 'ink'; o.d = s.d0 + (s.k === 'air' ? 0 : s.len * f); return; } }
          }
          // где на маршруте пера лежит точка чертежа: по ней грань бриллианта проявляется вслед за пером
          function uOf(x, y) {
            var p = P2(x, y), best = 1e9, u = 0;
            for (var j = 0; j < INK.length; j++) { var s = INK[j], dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1], f = clamp(((p[0] - s.a[0]) * dx + (p[1] - s.a[1]) * dz) / (s.len * s.len), 0, 1), ex = s.a[0] + dx * f - p[0], ez = s.a[1] + dz * f - p[1], d = ex * ex + ez * ez; if (d < best - 1e-9) { best = d; u = s.d0 + s.len * f; } }
            return u;
          }
          function dashOn(s, pat) { var per = 0, j; for (j = 0; j < pat.length; j++) per += pat[j]; var x = s % per; for (j = 0; j < pat.length; j++) { if (x < pat[j]) return j % 2 === 0; x -= pat[j]; } return true; }
          // ---- лист: метки обреза, тонкая рамка, штамп с подписью PTH 05 ----
          var PW = 1.08, PH = 0.64, PS = [], PD = [];
          function pl(a, b, br) { PS.push({ a: a, b: b, len: Math.hypot(b[0] - a[0], b[1] - a[1]), br: br }); }
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { var x = c[0] * PW, z = c[1] * PH; pl([x, z], [x - c[0] * 0.13, z], 1); pl([x, z], [x, z - c[1] * 0.13], 1); });
          pl([-PW + 0.05, -PH + 0.05], [PW - 0.05, -PH + 0.05], 0.3); pl([PW - 0.05, -PH + 0.05], [PW - 0.05, PH - 0.05], 0.3); pl([PW - 0.05, PH - 0.05], [-PW + 0.05, PH - 0.05], 0.3); pl([-PW + 0.05, PH - 0.05], [-PW + 0.05, -PH + 0.05], 0.3);
          var TB = [0.58, 0.45, PW - 0.05, PH - 0.05]; pl([TB[0], TB[1]], [TB[2], TB[1]], 0.6); pl([TB[0], TB[1]], [TB[0], TB[3]], 0.6); pl([TB[0] + 0.24, TB[1]], [TB[0] + 0.24, TB[3]], 0.45);
          (function () { var txt = 'PTH 05', px = 0.0125, x0 = TB[0] + 0.035, z0 = TB[1] + 0.03; for (var c = 0; c < txt.length; c++) { var bm = FONT[txt[c]]; if (!bm) continue; for (var q = 0; q < 35; q++) if (bm[q] === '1') PD.push([x0 + (c * 6 + q % 5) * px * 0.82, z0 + Math.floor(q / 5) * px]); } })();
          // ---- состояние ----
          var tau = 0, drawn = 0, lift = 0, phi = 0, phiV = 0, ctl = 0, enT = 0, trail = [], glints = [], sparks = [], glT = 0;
          var pp = { x: START[0], z: START[1], air: true, ink: false, d: 0 }, hp = { x: 0, z: 0 }, pq = { x: 0, y: 0 }, pen = { x: START[0], y: Y0 + 0.2, z: START[1] }, pv = { x: 0, z: 0 };
          var AX0 = [0.3, 0.9, -0.35], AX = [0, 1, 0], WV = [1, 0, 0], NV = [0, 0, 1], G = { d: 0, cs: 1, sn: 0, el: 0, gs: 1, cp: 1, sp: 0, sh: 0 };
          function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
          function penAxes(lx, lz) {
            AX = norm3([AX0[0] - lx, AX0[1], AX0[2] - lz]);
            var w = [AX[1], -AX[0], 0], wl = Math.hypot(w[0], w[1]) || 1; WV = [w[0] / wl, w[1] / wl, 0];
            NV = [AX[1] * WV[2] - AX[2] * WV[1], AX[2] * WV[0] - AX[0] * WV[2], AX[0] * WV[1] - AX[1] * WV[0]];
          }
          penAxes(0, 0);
          // чертёж → объём: глубина вырастает, лист «откидывается» вверх (поворот вокруг оси x), камень поднимается и
          // растёт, потом вращается вокруг своей оси. При lift = 0 точка лежит ровно на своей линии чертежа.
          function gemSetup() {
            G.d = sstep(0.08, 0.7, lift); var th = 1.5708 * sstep(0.15, 1, lift); G.cs = Math.cos(th); G.sn = Math.sin(th);
            G.el = 0.62 * sstep(0, 0.6, lift); G.gs = 1 + 0.3 * sstep(0.2, 1, lift); G.cp = Math.cos(phi); G.sp = Math.sin(phi); G.sh = 0.16 * sstep(0.1, 1, lift);
          }
          function gemPos(x3, y3, z3, o) {
            var vx = x3 * K * G.gs, vy = z3 * K * G.d * G.gs, vz = -(y3 - YC) * K * G.gs, yy = vy * G.cs - vz * G.sn, zz = vy * G.sn + vz * G.cs;
            o.x = vx * G.cp + zz * G.sp; o.z = -vx * G.sp + zz * G.cp; o.y = Y0 + G.el + yy - G.sh;
          }
          function toPaper(sx, sy, out) {
            var x = out.x, z = out.z, h = 0.01;
            for (var it = 0; it < 6; it++) {
              core.project(x, Y0, z, pq); var px = pq.x, py = pq.y; core.project(x + h, Y0, z, pq); var ax = (pq.x - px) / h, ay = (pq.y - py) / h; core.project(x, Y0, z + h, pq); var bx = (pq.x - px) / h, by = (pq.y - py) / h;
              var det = ax * by - bx * ay; if (Math.abs(det) < 1e-6) break; var ex = sx - px, ey = sy - py; x += (ex * by - bx * ey) / det; z += (ax * ey - ex * ay) / det;
            }
            out.x = clamp(x, -PW, PW); out.z = clamp(z, -PH, PH);
          }
          var tmpS = { x: 0, z: 0 }, gp = { x: 0, y: 0, z: 0 };
          var self = {
            key: 'pen', name: 'Перо и бриллиант', idea: '',
            pitch: 1.0, sway: 0.2, yaw0: 0.05, sc: 1.1, k: 0.22,
            build: function (P) {
              function inkCol(o) { return mix3(iri(0.05 + o.u / LD * 0.9), COL.frost, 0.4); }
              INK.forEach(function (s) { P.add(s.len * 0.28, function (o) { o.u = s.d0 + Math.random() * s.len; o.v = Math.random() - 0.5; o.w = 0; o.q = 0; }, inkCol, 0, 1); });
              GDS.forEach(function (s) {
                P.add(s.len * (s.k === 'dim' ? 0.11 : 0.09), function (o) {
                  var t = Math.random(); for (var r = 0; r < 8 && s.dash && !dashOn(s.s0 + t * s.len, s.dash); r++) t = Math.random();
                  o.u = s.d0 + t * s.len; o.v = Math.random() - 0.5; o.w = s.k === 'dim' ? 1 : 0; o.q = 4;
                }, s.k === 'dim' ? COL.ice : COL.glass, 0, s.k === 'dim' ? 1 : 0.75, 0.9);
              });
              E3.forEach(function (E, e) {
                P.add(segLen(E[0], E[1]) * 0.15, function (o) {
                  var t = Math.random(), x = E[0][0] + (E[1][0] - E[0][0]) * t, y = E[0][1] + (E[1][1] - E[0][1]) * t;
                  o.u = uOf(x, y); o.v = e + t * 0.999; o.w = Math.random(); o.q = 5;
                }, function (o) { return mix3(COL.frost, iri(o.w), 0.35); }, 3, 1);
              });
              PS.forEach(function (s) { P.add(s.len * (s.br > 0.9 ? 0.12 : 0.035), function (o) { var t = Math.random(); o.u = s.a[0] + (s.b[0] - s.a[0]) * t; o.v = s.a[1] + (s.b[1] - s.a[1]) * t; o.w = s.br; o.q = 3; }, COL.glass, 2, 0.6); });
              P.add(0.07, function (o) { var d = PD[Math.floor(Math.random() * PD.length)]; o.u = d[0] + rnd(-0.003, 0.003); o.v = d[1] + rnd(-0.003, 0.003); o.w = 0.7; o.q = 3; }, COL.ice, 2, 0.8);
              P.add(0.11, function (o) {
                var s = Math.random(), sp = rnd(0, 0.3), wmax = 0.055 * sstep(0, 0.2, sp) * (sp > 0.26 ? (0.3 - sp) / 0.04 * 0.6 + 0.4 : 1);
                if (s < 0.6) { o.u = sp; o.v = (Math.random() < 0.5 ? -1 : 1) * wmax; }
                else if (s < 0.8) { o.u = rnd(0, 0.13); o.v = 0; }
                else if (s < 0.9) { var a = Math.random() * TAU; o.u = 0.14 + 0.012 * Math.cos(a); o.v = 0.012 * Math.sin(a); }
                else { o.u = sp; o.v = rnd(-1, 1) * wmax; }
                o.w = 0; o.q = 1;
              }, COL.frost, 1, 0.95);
              P.add(0.09, function (o) { var s = rnd(0.3, 0.85), a = Math.random() < 0.6 ? Math.floor(Math.random() * 10) * TAU / 10 : Math.random() * TAU; o.u = s; o.v = a; o.w = Math.random() < 0.6 ? 0 : 1; o.q = 2; }, function () { return mix3(COL.glass, COL.lil, Math.random() * 0.5); }, 1, 0.55);
            },
            f: function (A, i, t, o) {
              var q = A[i + 3];
              if (q < 0.5 || (q > 3.5 && q < 4.5)) {                       // линии чертежа: перо и карандаш
                var u = A[i], s = atLen(u, o), w = A[i + 1] * s.w; o.x += s.nx * w; o.z += s.nz * w; o.y = Y0 - G.sh;
                if (u > drawn) { o.b = 0; return; }
                var age = drawn - u, wet = Math.max(0, 1 - age / 0.05), sheen = Math.max(0, 1 - age / 0.45);
                o.b = (q > 3.5 ? (A[i + 2] > 0.5 ? 1 : 0.6) : 1) * (1 + 2.4 * wet + 0.55 * sheen) * (q < 0.5 ? 1 - 0.4 * sstep(0, 1, lift) : 1 - 0.55 * sstep(0, 1, lift));
                return;
              }
              if (q > 4.5) {                                                // грани бриллианта
                var ev = A[i + 1], e = ev | 0, tt = ev - e, E = E3[e];
                gemPos(E[0][0] + (E[1][0] - E[0][0]) * tt, E[0][1] + (E[1][1] - E[0][1]) * tt, E[0][2] + (E[1][2] - E[0][2]) * tt, o);
                if (A[i] > drawn) { o.b = 0; return; }
                var ag = drawn - A[i];
                o.b = 1 + 2.4 * Math.max(0, 1 - ag / 0.05) + lift * (0.25 + 0.45 * Math.max(0, Math.sin(t * 2.2 + A[i + 2] * 40)));
                return;
              }
              if (q > 2.5) { o.x = A[i]; o.y = Y0 - 0.003 - G.sh; o.z = A[i + 1]; o.b = A[i + 2]; return; }   // лист
              var sx = A[i], wx, wy, wz;                                     // перо: кончик (q 1) и корпус (q 2)
              if (q < 1.5) { var ww = A[i + 1], cv = (ww / 0.055) * (ww / 0.055) * 0.012; wx = WV[0] * ww + NV[0] * cv; wy = WV[1] * ww + NV[1] * cv; wz = WV[2] * ww + NV[2] * cv; }
              else { var a2 = A[i + 1], r = A[i + 2] > 0.5 ? 0.06 * (0.8 + 0.2 * Math.sin(sx * 30)) : 0.06, ca = Math.cos(a2) * r, sa = Math.sin(a2) * r; wx = WV[0] * ca + NV[0] * sa; wy = WV[1] * ca + NV[1] * sa; wz = WV[2] * ca + NV[2] * sa; }
              o.x = pen.x + AX[0] * sx + wx; o.y = pen.y + AX[1] * sx + wy - G.sh; o.z = pen.z + AX[2] * sx + wz;
              o.snap = core.t - enT > 1.3;                                   // перо прилетело — дальше без пружины, ровно на кончике
            },
            enter: function () {
              tau = 0; drawn = 0; lift = 0; phi = 0; phiV = 0; ctl = 0; trail = []; glints = []; sparks = []; glT = 0; enT = core.t;
              self.pitch = 1.0; pen.x = START[0]; pen.z = START[1]; pen.y = Y0 + 0.2; pv.x = pv.z = 0; core.gBright[2] = 0; gemSetup();
            },
            reset: function () { self.pitch = 1.0; },
            upd: function (dt, e) {
              var m = core.mouse, p = core.panel, inP = m.in && m.x > p.x && m.x < p.x + p.w && m.y > p.y && m.y < p.y + p.h, j;
              if (env.rm) { drawn = LD; lift = 1; phi = 0.55; self.pitch = 0.4; core.gBright[2] = 1; gemSetup(); pen.x = REST[0]; pen.z = REST[1]; pen.y = Y0 + 0.16; penAxes(0, 0); return; }
              core.gBright[2] = Math.min(1, (core.t - enT) / 0.6);
              // перо у курсора — чертёж стоит; отпустили — перо возвращается к своей линии и продолжает
              ctl += ((inP && lift < 0.02 ? 1 : 0) - ctl) * Math.min(1, dt * 7);
              if (ctl < 0.03) tau += dt;
              penAt(Math.min(tau, TT), pp); if (pp.d > drawn) drawn = pp.d;
              var c = ease(ctl), ox = pen.x, oz = pen.z, ty;
              if (ctl > 0.001) { toPaper(m.x, m.y, hp); }
              pen.x = pp.x + (hp.x - pp.x) * c; pen.z = pp.z + (hp.z - pp.z) * c;
              ty = tau >= TT ? Y0 + 0.16 : Y0 + (pp.air ? 0.075 : 0); if (ctl > 0.001) ty = ty * (1 - c) + Y0 * c;
              pen.y += (ty - pen.y) * Math.min(1, dt * 16);
              // наклон пера по ходу движения: корпус чуть отстаёт, как при настоящем штрихе
              if (dt > 0) { pv.x += ((pen.x - ox) / dt - pv.x) * Math.min(1, dt * 8); pv.z += ((pen.z - oz) / dt - pv.z) * Math.min(1, dt * 8); }
              penAxes(clamp(pv.x * 0.07, -0.35, 0.35), clamp(pv.z * 0.07, -0.35, 0.35));
              // рисунок курсором: чернила гаснут за 4 с
              if (ctl > 0.6) { var lt = trail[trail.length - 1]; if (!lt || Math.hypot(lt.x - pen.x, lt.z - pen.z) > 0.006) trail.push({ x: pen.x, z: pen.z, t: core.t }); if (trail.length > 700) trail.shift(); }
              for (j = trail.length - 1; j >= 0; j--) { var tp = trail[j], age = core.t - tp.t; if (age > 4) { trail.splice(0, j + 1); break; } core.pt(tp.x, Y0 - G.sh, tp.z, COL.ice, 1 - age / 4, 2.4); }
              // свежие чернила у кончика
              if (pp.ink && ctl < 0.03 && tau < TDRAW) { core.pt(pen.x, Y0, pen.z, COL.frost, 0.95, 5.5); core.pt(pen.x, Y0, pen.z, COL.ice, 0.35, 11); }
              // чертёж встаёт объёмом
              lift = ease(clamp((tau - LIFT0) / LIFTD, 0, 1));
              self.pitch = 1.0 - 0.6 * sstep(0.05, 0.85, lift);
              if (lift > 0.6) { var mm = (m.x - core.cx) / core.S; phiV += ((0.45 + (inP ? clamp(mm, -1, 1) * 1.8 : 0)) * sstep(0.6, 1, lift) - phiV) * Math.min(1, dt * 2); phi += phiV * dt; }
              gemSetup();
              // искры на вершинах и «огонь» — цветные блики, слетающие с граней
              if (lift > 0.85) {
                glT -= dt;
                if (glT <= 0) { glT = 0.16 + Math.random() * 0.2; var v = VX[Math.floor(Math.random() * VX.length)]; glints.push({ v: v, t0: core.t, c: Math.random() < 0.5 ? COL.frost : [COL.ice, COL.lil, COL.mint][Math.floor(Math.random() * 3)] }); }
                if (sparks.length < 90 && Math.random() < dt * 40) { var E = E3[Math.floor(Math.random() * E3.length)], f = Math.random(); gemPos(E[0][0] + (E[1][0] - E[0][0]) * f, E[0][1] + (E[1][1] - E[0][1]) * f, E[0][2] + (E[1][2] - E[0][2]) * f, gp); var hx = { x: 0, y: 0, z: 0 }; sph([0, 0, 0], 1, hx); sparks.push({ x: gp.x, y: gp.y, z: gp.z, vx: hx.x * 0.18, vy: hx.y * 0.18 + 0.05, vz: hx.z * 0.18, l: 1, c: [COL.ice, COL.az, COL.lil, COL.mint][Math.floor(Math.random() * 4)] }); }
              }
              for (j = glints.length - 1; j >= 0; j--) {
                var g = glints[j], ga = (core.t - g.t0) / 0.6; if (ga >= 1) { glints.splice(j, 1); continue; }
                gemPos(g.v[0], g.v[1], g.v[2], gp); var amp = Math.sin(Math.PI * ga), len = 0.13 * amp;
                core.pt(gp.x, gp.y, gp.z, COL.frost, amp, 7 * amp + 1);
                for (var s2 = 1; s2 <= 6; s2++) { var f2 = s2 / 6, aa = amp * (1 - f2) * 0.9; core.pt(gp.x + len * f2, gp.y, gp.z, g.c, aa, 2.2); core.pt(gp.x - len * f2, gp.y, gp.z, g.c, aa, 2.2); core.pt(gp.x, gp.y + len * f2, gp.z, g.c, aa, 2.2); core.pt(gp.x, gp.y - len * f2, gp.z, g.c, aa, 2.2); }
              }
              for (j = sparks.length - 1; j >= 0; j--) { var sp = sparks[j]; sp.l -= dt * 1.6; if (sp.l <= 0) { sparks.splice(j, 1); continue; } sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.z += sp.vz * dt; core.pt(sp.x, sp.y, sp.z, sp.c, sp.l * 0.8, 2); }
              core.pt(pen.x, pen.y - G.sh, pen.z, COL.frost, 0.85, 4.5);
            }
          };
          add(4, 1, self);
        })();
        return L;
      }

      // ===== сцена hero: пять принципов по очереди =====
      var NAMES = ['Хрустальный ферзь', 'Оптический прицел', 'Ускоритель', 'Шифровальные роторы', 'Перо и бриллиант'];
      var DUR = [8.5, 7.5, 7.5, 9, 10];
      // цвет принципа: частицы объекта тонируются (05 — без тона: у пера и бриллианта свой перелив), интерфейс панели берёт --acc
      var ACC = ['#8ED8F8', '#7FA8FF', '#B7A6F2', '#9FE5D1', '#C9C2F5'], TINT = [[0.557, 0.847, 0.973], [0.498, 0.659, 1], [0.718, 0.651, 0.949], [0.624, 0.898, 0.82], [1, 1, 1]], TK = [0.5, 0.55, 0.5, 0.5, 0];
      function tr(s) { return window.PTI18N && window.PTI18N.t ? window.PTI18N.t(s) : s; }
      function makeScene(core, root, env) {
        var SHP = makeShapes(core, env), opts = root.__ptHeroOpts || {};
        var cur = -1, e = 0, kT = 0, cache = {}, swT = 0, slot = 0, slotT = 0, started = false, lang = '';
        var nameEl = root.querySelector('[data-objname]'), idxEl = root.querySelector('[data-objidx]'), capT = root.querySelector('[data-captitle]'), ring = root.querySelector('[data-ring]'), RL = ring ? 2 * Math.PI * (+ring.getAttribute('r') || 25) : 0;
        var panelEl = root.querySelector('[data-obj]'), usp = Array.prototype.slice.call(root.querySelectorAll('[data-usp]')), fills = usp.map(function (u) { return u.querySelector('[data-usp-fill]'); });
        var uspRow = usp.length ? usp[0].parentNode : null;
        SHP.forEach(function (s, i) { core.dyn[i + 1] = s.f; });
        core.onLayout = function () {
          var p = core.panel, s = SHP[cur < 0 ? 0 : cur];
          // объект — между вкладками сверху и подписью снизу; на телефоне подпись со стрелками выше (стрелки под текстом),
          // поэтому объект выше и мельче
          core.cx = p.x + p.w * 0.5;
          if (env.mob) { core.cy = p.y + p.h * 0.41; core.S = Math.min(p.w * 0.36, p.h * 0.21) * (s ? s.sc : 1); return; }
          // десктоп: объект — в свободной полосе между вкладками (низ ~87 px + зазор) и подписью со стрелками (две строки —
          // ~99 px от низа + зазор 21: доска ферзя в ходе опускается ниже обычного). Вверх от центра объекты выступают до 0.95 S (прицел), вниз — до 1.2 S (доска ферзя,
          // лист пера): S — наибольший, что помещается в полосу, но не больше min(0.37 ширины, 0.32 высоты), центр — так,
          // чтобы запас сверху и снизу был поровну. Было: центр на 52 % высоты и 0.28 высоты — ферзь и перо задевали
          // подпись на 1280×720, а на высоких панелях объект был мелковат
          var z0 = 95, z1 = p.h - 120, S = Math.max(40, Math.min(p.w * 0.37, p.h * 0.32, (z1 - z0) / 2.15));
          core.S = S * (s ? s.sc : 1);
          core.cy = p.y + z0 + 0.95 * S + Math.max(0, z1 - z0 - 2.15 * S) / 2;
        };
        core.overlay = function (g) { var s = SHP[cur]; if (s && s.ov) s.ov(g); };
        function parts(i) { if (!cache[i]) { var P = new Parts(); SHP[i].build(P); cache[i] = P; } return cache[i]; }
        function labels() {
          lang = window.PTI18N ? window.PTI18N.lang : 'ru';
          // название объекта — в aria-label панели, цвет принципа — --acc и data-slot (CSS); внизу заголовок и описание
          // активного принципа из его вкладки (.usp-n / .usp-t): в DOM они уже на текущем языке и с неразрывными
          // пробелами. Меняются одним блоком [data-objcapw] через прозрачность (CSS .is-swap, 2 × 150 мс)
          var nm = tr(NAMES[slot]), pnl = root.querySelector('[data-obj]'), cap = root.querySelector('[data-objcap]'), capW = root.querySelector('[data-objcapw]') || cap;
          var tab = root.querySelector('[data-usp="' + slot + '"]'), hn = tab && tab.querySelector('.usp-n'), src = tab && tab.querySelector('.usp-t');
          if (nameEl) nameEl.textContent = nm;
          if (idxEl) idxEl.textContent = '0' + (slot + 1) + ' / 05';
          if (pnl) { pnl.setAttribute('aria-label', nm); pnl.style.setProperty('--acc', ACC[slot]); pnl.setAttribute('data-slot', String(slot + 1)); }
          var head = hn ? hn.textContent : '', txt = src ? src.textContent : '', key = head + '|' + txt;
          if (cap && capW.__key !== key) {
            capW.__key = key; clearTimeout(capW.__t);
            var put = function () { if (capT) capT.textContent = head; cap.textContent = txt; capW.classList.remove('is-swap'); };
            if (env.rm || !cap.textContent || (cap.textContent === txt && (!capT || capT.textContent === head))) put();
            else { capW.classList.add('is-swap'); capW.__t = setTimeout(put, 150); }
          }
        }
        function go(i, mode) {
          if (cur >= 0 && SHP[cur].reset) SHP[cur].reset();
          cur = i; var s = SHP[i]; swT = core.t;
          core.gBright.fill(1); core.gScale.fill(1);
          if (s.enter) s.enter();
          var inst = mode === 'instant';
          core.assign(core.all(), parts(i), mode === 'build' ? function () { return Math.random() * 1.3; } : function () { return Math.random() * 0.6; }, inst, i + 1);
          if (mode === 'next' && !env.rm) core.kick(core.all(), 0.025);
          core.k = inst ? kT : 0.03; kT = s.k || 0.08; if (inst) core.k = kT;
          core.cam.spin = s.spin || 0; core.cam.hold = s.sway != null || !!s.hold;
          core.onLayout();
        }
        function setSlot(k, mode) {
          slot = (k + 5) % 5; slotT = 0; go(slot, mode || 'next'); labels();
          usp.forEach(function (u, j) { u.setAttribute('aria-current', j === slot ? 'step' : 'false'); });
          if (uspRow && uspRow.scrollWidth > uspRow.clientWidth + 4) { var a = usp[slot]; uspRow.scrollTo({ left: a.offsetLeft - uspRow.offsetLeft - 8, behavior: env.rm ? 'auto' : 'smooth' }); }
        }
        function setSt(el, k, v) { if (el['__' + k] !== v) { el['__' + k] = v; el.style[k] = v; } }
        // полоска активной вкладки — анимация компоновщика (Web Animations), а не запись transform в каждом кадре: смена
        // scaleX у обычного элемента заставляла браузер в каждом кадре пересобирать слои всей страницы (TASK-qa.md, простой
        // при CPU ×4). Ход тот же — scaleX от 0 до 1 линейно за время принципа; ведёт по-прежнему slotT: анимация стоит, пока
        // стоит slotT (курсор над панелью), и подводится к нему, если разошлась (старт анимации на кадр позже, скрытая вкладка, кадр дольше 50 мс)
        var fa = null, faEl = null;
        function fillAnim(el) {
          if (env.rm || !el.animate) return false;
          if (faEl !== el || !fa) {
            if (fa) fa.cancel();
            faEl = el; fa = el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DUR[slot] * 1000, fill: 'both' });
          }
          var want = Math.min(1, slotT / DUR[slot]) * DUR[slot] * 1000, run = e < 0.5;
          if (run && fa.playState === 'paused') fa.play();
          else if (!run && fa.playState !== 'paused') fa.pause();
          var ct = fa.currentTime;
          if (ct == null || Math.abs(ct - want) > 20) fa.currentTime = want;
          return true;
        }
        core.update = function (dt) {
          if (!started) return;
          var s = SHP[cur], m = core.mouse, p = core.panel;
          var inP = m.in && m.x > p.x && m.x < p.x + p.w && m.y > p.y && m.y < p.y + p.h;
          e += ((inP ? 1 : 0) - e) * Math.min(1, dt * 2.2);
          if (core.t - swT > 1.5) core.k += (kT - core.k) * Math.min(1, dt * 1.5);
          core.cam.pitch += (s.pitch - core.cam.pitch) * Math.min(1, dt * 2);
          if (core.cam.hold) { core.cam.holdPitch = s.pitch + (env.rm ? 0 : Math.cos(core.t * 0.17) * (s.sway || 0) * 0.25); core.cam.holdYaw = (s.yaw0 || 0) + (env.rm ? 0 : Math.sin(core.t * 0.21) * (s.sway || 0)); }
          s.upd(env.rm ? 0 : dt, e);
          if (!env.rm) { if (e < 0.5) slotT += dt; if (slotT > DUR[slot]) setSlot(slot + 1); }
          var tg = TINT[slot], kk = env.rm ? 1 : Math.min(1, dt * 2.5); core.tk += (TK[slot] - core.tk) * kk; for (var q = 0; q < 3; q++) core.tint[q] += (tg[q] - core.tint[q]) * kk;
          // стиль пишется, только когда значение изменилось: запись того же значения каждый кадр всё равно помечала элемент
          // к пересчёту стилей (заполненные и пустые полоски, кольцо на паузе) — TASK-qa.md, картинка та же
          if (ring) setSt(ring, 'strokeDashoffset', (RL * (1 - (env.rm ? 1 : Math.min(1, slotT / DUR[slot])))).toFixed(1));
          if (panelEl) panelEl.classList.toggle('is-paused', e >= 0.5);
          for (var j = 0; j < fills.length; j++) if (fills[j] && (j !== slot || !fillAnim(fills[j]))) setSt(fills[j], 'transform', 'scaleX(' + (j < slot ? 1 : (j > slot ? 0 : (env.rm ? 1 : Math.min(1, slotT / DUR[slot])))).toFixed(3) + ')');
          if (window.PTI18N && window.PTI18N.lang !== lang) labels();
        };
        usp.forEach(function (u) { u.addEventListener('click', function (ev) { ev.stopPropagation(); if (started) setSlot(+u.getAttribute('data-usp')); }); });
        var prev = root.querySelector('[data-prev]'), next = root.querySelector('[data-next]');
        if (prev) prev.addEventListener('click', function (ev) { ev.stopPropagation(); if (started) setSlot(slot - 1); });
        if (next) next.addEventListener('click', function (ev) { ev.stopPropagation(); if (started) setSlot(slot + 1); });
        if (panelEl) panelEl.addEventListener('click', function () { if (started) setSlot(slot + 1); });
        core.cam.pitch = 0.3; core.cam.yaw = 0.5;
        function begin(instant) { started = true; setSlot(0, instant ? 'instant' : 'build'); if (instant) { core.step(0); core.snapAll(); } }
        return {
          start: function () { if (opts.autostart !== false) begin(!!opts.instant); },
          begin: begin,
          replay: function () { if (!started) { begin(false); return; } core.kick(core.all(), 0.35); setSlot(slot, 'build'); },
          go: function (k) { if (started) setSlot(k); },
          relabel: labels
        };
      }
      return boot(root, makeScene);
  };
  function ensureCanvas(root) {
    ['data-gl', 'data-ov'].forEach(function (a, k) {
      if (root.querySelector('[' + a + ']')) return;
      var c = document.createElement('canvas'); c.setAttribute(a, ''); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-pt-skip', '');
      c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;pointer-events:none;z-index:' + (3 + k);
      root.insertBefore(c, root.firstChild);
    });
  }
  window.PTHero = {
    mount: function (root, opts) {
      if (!root) return null;
      root.__ptHeroOpts = opts || {}; ensureCanvas(root);
      var h = factory(root); if (!h) return null;
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { h.setActive(e.isIntersecting); }); }, { threshold: 0.01 }).observe(root);
      return { count: h.core.N, start: function (instant) { h.scene.begin(!!instant); }, replay: function () { h.scene.replay(); }, go: function (k) { h.scene.go(k); }, relabel: function () { h.scene.relabel(); }, setActive: h.setActive, destroy: h.destroy };
    }
  };
})();
