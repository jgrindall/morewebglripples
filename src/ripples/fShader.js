
const fragmentShader = `
uniform vec2 u_resolution;
uniform vec3 u_mouse;
uniform float u_time;
uniform sampler2D u_noise;
uniform sampler2D u_buffer;
uniform sampler2D u_environment;
uniform sampler2D u_texture;
uniform bool u_renderpass;
uniform int u_frame;

#define PI 3.141592653589793
#define TAU 6.283185307179586
#define velPropagation 1.4
#define pow2(x) (x * x)

const float bias = .2;
const float scale = 10.0;
const float power = 10.1;

const float blurMultiplier = 0.95;
const float blurStrength = 2.98;
const int samples = 4;
const float sigma = float(samples) * 0.25;


vec2 hash2(vec2 p){
    vec2 o = texture2D( u_noise, (p + 0.5)/256.0, -100.0 ).xy;
    return o;
}

float gaussian(vec2 i) {
    return 1.0 / (2.0 * PI * pow2(sigma)) * exp(-((pow2(i.x) + pow2(i.y)) / (2.0 * pow2(sigma))));
}

vec3 hash33(vec3 p){ 
    float n = sin(dot(p, vec3(7, 157, 113)));    
    return fract(vec3(2097152, 262144, 32768)*n); 
}

vec3 blur(sampler2D sp, vec2 uv, vec2 scale) {
    vec3 col = vec3(0.0);
    float accum = 0.0;
    float weight;
    vec2 offset;

    for (int x = -samples / 2; x < samples / 2; ++x) {
        for (int y = -samples / 2; y < samples / 2; ++y) {
            offset = vec2(x, y);
            weight = gaussian(offset);
            col += texture2D(sp, uv + scale * offset).rgb * weight;
            accum += weight;
        }
    }

    return col / accum;
}

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0 );
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 domain(vec2 z){
    return vec3(hsb2rgb(vec3(atan(z.y, z.x)/TAU, 1.0, 1.0)));
}
vec3 colour(vec2 z) {
    return domain(z);
}

vec4 renderRipples() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    vec3 e = vec3(3.6 / u_resolution.x, 3.6 / u_resolution.y, 0.0);
    vec2 _sample = gl_FragCoord.xy / u_resolution.xy;
    float ratio = u_resolution.x / u_resolution.y;
    vec2 mouse = u_mouse.xy - uv;
    vec4 fragcolour = texture2D(u_buffer, _sample);
    vec4 texcol = fragcolour;
    
    float shade = 0.0;
    if(u_mouse.z == 1.0) {
        float _sin = sin(u_time * 10.0) * 0.006;
        shade = smoothstep(0.05 + _sin, 0.0, length(mouse));
    }
    float d;
    if(u_frame < 5){
        d = 0.5;
    }
    else{
        d = shade * 2.0;
        float t = texture2D(u_buffer, _sample - e.zy, 1.0).x;
        float r = texture2D(u_buffer, _sample - e.xz, 1.0).x;
        float b = texture2D(u_buffer, _sample + e.xz, 1.0).x;
        float l = texture2D(u_buffer, _sample + e.zy, 1.0).x;
        d += -(texcol.y - 0.5)*2.0 + (t + r + b + l - 2.0);
        d *= 0.85;
        d = d*0.5 + 0.5;
    }
    fragcolour = vec4(d, texcol.x, 0, 0);
    return fragcolour;
}

//   Naive environment mapping. Pass the reflected vector and pull back the texture position for that ray.
vec3 envMap(vec3 rd, vec3 sn, float scale){
    vec3 col = texture2D(u_environment, rd.xy - 0.5).rgb * 2.0;
    col *= normalize(col);
    return col;

}

float bumpMap(vec2 uv, float height, inout vec3 colourmap) {
    vec3 shade;
    vec2 _sample = gl_FragCoord.xy / u_resolution.xy;
    _sample += uv;
    vec2 ps = vec2(1.0) / u_resolution.xy;
    shade = vec3(blur(u_buffer, _sample, ps*blurStrength));
    return 1. - shade.x * height;
}

float bumpMap(vec2 uv, float height) {
    vec3 colourmap;
    return bumpMap(uv, height, colourmap);
}

vec4 renderPass(vec2 uv, inout float distortion) {
    vec3 surfacePos = vec3(uv, 0.0);
    vec3 ray = normalize(vec3(uv, 1.0));
    
    vec3 normal = vec3(0.0, 0.0, -1.0);

    vec2 sampleDistance = vec2(0.005, 0.0);
    
    vec3 colourmap;
    
    float fx = bumpMap(sampleDistance.xy, 0.2);
    float fy = bumpMap(sampleDistance.yx, 0.2);
    float f = bumpMap(vec2(0.0), 0.2, colourmap);
    
    distortion = f;
    
    fx = (fx - f)/sampleDistance.x;
    fy = (fy - f)/sampleDistance.x;
    normal = normalize( normal + vec3(fx, fy, 0) * 0.2 );
    
    float shade = bias + (scale * pow(1.0 + dot(normalize(surfacePos-vec3(uv, -3.0)), normal), power));

    float falloff = 0.1;
    
    float diffuse = max(dot(normal, vec3(0, 0, 1.0)), 0.0);
    
    vec3 reflect_ray = reflect(vec3(uv, 1.0), normal * 1.0);
    vec3 tex = envMap(reflect_ray, normal, 1.5) * (shade + 0.5);

    vec3 texCol = (vec3(0.4, 0.6, 0.9) + tex * 1.0) * 0.5;
    
    vec3 colour = (texCol * (diffuse*vec3(1, 0.97, 0.92)*2. + 0.5))*1.5;
    
    return vec4(colour, 1.);
}

void main() {
    
    vec4 fragcolour = vec4(0);
    
    if(u_renderpass) {
        fragcolour = renderRipples();
    }
    else {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
        vec2 _sample = gl_FragCoord.xy / u_resolution.xy;
        
        float distortion;
        vec4 reflections = renderPass(uv, distortion);
        
        vec4 c = texture2D(u_texture, uv*1.5 + distortion).rbra;
        fragcolour = c * c * c * .4;
        fragcolour *= fragcolour; 
        vec4 b = texture2D(u_buffer, _sample + 0.03);
        fragcolour += b.x*0.1 - 0.1;
        fragcolour += reflections*.7;
    }

    gl_FragColor = fragcolour;
    }
`

export default fragmentShader