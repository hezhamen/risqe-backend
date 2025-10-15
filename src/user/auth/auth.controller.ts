import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user and returns a JWT.\n\n' +
      'Example:\n' +
      '\`\`\`json\n{\n  "email": "user@example.com",\n  "password": "secret123"\n}\n\`\`\`',
  })
  @ApiCreatedResponse({ description: 'User registered', schema: { example: { access_token: 'jwt.token.here' } } })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Returns a JWT for authenticated requests.\\n\\n' +
      'Curl:\\n' +
      '\\`\\`\\`bash\\n' +
      'curl -s -X POST http://localhost:3000/auth/login \\\\n' +
      '  -H "Content-Type: application/json" \\\\n' +
      "  -d '{\\n    \\\"email\\\": \\\"user@example.com\\\",\\n    \\\"password\\\": \\\"secret123\\\"\\n  }'\\n" +
      '\\`\\`\\`',
  })
  @ApiOkResponse({ description: 'Login successful', schema: { example: { access_token: 'jwt.token.here' } } })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
