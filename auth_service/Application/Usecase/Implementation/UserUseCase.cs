using auth_service.Application.Security;
using auth_service.Application.Usecase.DTO;
using auth_service.Application.Usecase.Interface;
using auth_service.Domain.Entity;
using auth_service.Domain.Repository;
using System.Text.Json;
using Microsoft.Extensions.Logging;


namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase : IUserUseCase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJWTTokenProvidder _jwtTokenProvider;
        private readonly IBcryptPasswordHasher _passwordHasher;
        protected readonly ILogger<UserUseCase> _logger;

        public UserUseCase(
            IUserRepository userRepository,
            IJWTTokenProvidder jwtTokenProvider,
            ILogger<UserUseCase> logger,
            IBcryptPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _jwtTokenProvider = jwtTokenProvider;
             _logger = logger;
            _passwordHasher = passwordHasher;
        }

}
}