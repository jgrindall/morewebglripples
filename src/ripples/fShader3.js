
const fragmentShader = `
uniform vec2 u_resolution;
uniform vec3 u_mouse;
uniform float u_time;
uniform sampler2D u_buffer;
uniform sampler2D u_texture;
uniform sampler2D u_environment;
uniform bool u_renderpass;

uniform int u_frame;

const float bias = 0.2;
const float scale = 5.0;
const float power = 20.0;

const vec3 blue = vec3(0.4, 0.6, 0.9);

vec4 renderRipples() {
    
    float gap_x = 5.0 / u_resolution.x;
    float gap_y = 5.0 / u_resolution.y;

    vec2 _sample = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    float ratio = u_resolution.x / u_resolution.y;
    vec2 mouse = u_mouse.xy - uv;

    vec4 fragcolour = texture2D(u_buffer, _sample);

    float t = texture2D(u_buffer, _sample - vec2(0.0, gap_y), 1.0).x;
    float r = texture2D(u_buffer, _sample - vec2(gap_x, 0.0), 1.0).x;
    float b = texture2D(u_buffer, _sample + vec2(gap_x, 0.0), 1.0).x;
    float l = texture2D(u_buffer, _sample + vec2(0.0, gap_y), 1.0).x;

    float shade = 0.0;
    if(u_mouse.z == 1.0) {
        float _sin = sin(u_time * 10.0) * 0.001;
        shade = smoothstep(0.05 + _sin, 0.0, length(mouse));
    }
    float d;
    if(u_frame < 5){
        d = 0.5;
    }
    else{
        float attenuation = 0.8;
        d = shade;
        d += -(fragcolour.y - 0.5)*2.0 + (t + r + b + l - 2.0);
        d *= attenuation;
        d = d*0.5 + 0.5;
    }
    fragcolour = vec4(d, fragcolour.x, 0, 0);
    return fragcolour;
}

vec3 normalizesum(vec3 a, vec3 b){
    return normalize(a + b);
}

vec3 get_normal(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float g = 0.002;
    float fx = texture2D(u_buffer, uv + vec2(g, 0.0)).r;
    float fy = texture2D(u_buffer, uv + vec2(0.0, g)).r;
    float f =  texture2D(u_buffer, uv + vec2(0.0, 0.0)).r;

    return vec3((fx - f)/g, (fy - f)/g, 0) * 0.5;
}

vec2 hash2(vec2 p ) {
    return fract(sin(vec2(dot(p, vec2(123.4, 748.6)), dot(p, vec2(547.3, 659.3))))*5232.85324);   
 }
 float hash(vec2 p) {
   return fract(sin(dot(p, vec2(43.232, 75.876)))*4526.3257);   
 }
 
 //Based off of iq's described here: https://iquilezles.org/articles/voronoilines
 float voronoi(vec2 p) {
     vec2 n = floor(p);
     vec2 f = fract(p);
     float md = 5.0;
     vec2 m = vec2(0.0);
     for (int i = -1;i<=1;i++) {
         for (int j = -1;j<=1;j++) {
             vec2 g = vec2(i, j);
             vec2 o = hash2(n+g);
             o = 0.5+0.5*sin(5.0*u_time+5.038*o);
             vec2 r = g + o - f;
             float d = dot(r, r);
             if (d<md) {
               md = d;
               m = n+g+o;
             }
         }
     }
     return md;
 }
 
 float ov(vec2 p) {
     float v = 0.0;
     float a = 0.4;
     for (int i = 0;i<3;i++) {
         v+= voronoi(p)*a;
         p*=2.0;
         a*=0.5;
     }
     return v;
 }
 
vec4 caustic(vec2 uv){
    vec4 a = vec4(0.4, 0.4, 0.5, 0.05);
    vec4 b = vec4(0.9, 0.9, 1.0, 0.1);
    return vec4(mix(a, b, smoothstep(0.0, 0.5, ov(uv*35.0))));
}

vec4 renderPass() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 uv_up = vec3(uv, 1.0);
    vec3 uv_down = vec3(uv, -1.0);
    vec3 surfacePos = vec3(uv, 0.0);
    vec3 ray = normalize(vec3(uv, 1.0));
    vec3 normal = vec3(0.0, 0.0, -1.0);

    vec3 v = get_normal();

    normal = normalizesum(normal, v);
    float a = 1.0 + dot(normalizesum(surfacePos, - uv_down), normal);
    float shade = bias + (scale * pow(a, power));
    vec3 reflect_ray = reflect(uv_up, normal);
    vec3 env = texture2D(u_texture, reflect_ray.xy).rgb;
    
    vec3 env1 = texture2D(u_environment, reflect_ray.xy).rgb;

    vec3 env2 = caustic(uv).rgb;

    vec3 tex = env * shade;
    vec3 texCol = (0.5*blue + tex + 0.3*env1 + 0.2*env2) / 2.0;
    return vec4(texCol, 1.0);
}

void main() {
    if(u_renderpass) {
        gl_FragColor = renderRipples();
    }
    else {
        gl_FragColor = renderPass();
    }
}
`

export default fragmentShader