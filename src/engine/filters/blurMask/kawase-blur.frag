
varying vec2 vTextureCoord;
varying vec2 vMaskCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;


uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

uniform vec2 uOffset;

void main(void)
{
    float clip = step(3.5,
    step(maskClamp.x, vMaskCoord.x) +
    step(maskClamp.y, vMaskCoord.y) +
    step(vMaskCoord.x, maskClamp.z) +
    step(vMaskCoord.y, maskClamp.w));


    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    float mask = alphaMul * masky.r * clip; 

    // end of mask - beginning of blur

    vec4 color = vec4(0.0);

    // Sample top left pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y));

    // Sample top right pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y));

    // Sample bottom right pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y));

    // Sample bottom left pixel
    color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y));

    // Average
    color *= 0.25;

    gl_FragColor = original * (1.0 - mask) + color * mask;
}