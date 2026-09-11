class AIClient[ClientT]:
    """Base class holding functionality shared by every provider client.

    `ClientT` is the provider SDK client a subclass wraps, e.g.
    `anthropic.Anthropic`. Subclasses parameterise the class with it,
    declare their own `DEFAULT_MODEL`, and implement `_create_client`,
    `send_message` and `ping`.
    """

    DEFAULT_MODEL: str = ""
    DEFAULT_MAX_TOKENS: int = 1000

    client: ClientT

    def __init__(
        self,
        model: str | None = None,
        max_tokens: int | None = None,
    ) -> None:
        self.model = model or self.DEFAULT_MODEL
        self.max_tokens = max_tokens or self.DEFAULT_MAX_TOKENS
        self.client = self._create_client()

    def _create_client(self) -> ClientT:
        """Build the provider SDK client. Overridden by child classes."""
        raise NotImplementedError

    def send_message(self, message: str) -> str:
        """Send a single user message and return the model's text response."""
        raise NotImplementedError

    def ping(self) -> bool:
        """Check the provider is reachable and the API key is accepted.

        Child classes hit their list-models endpoint, which returns metadata
        only and consumes no tokens.

        Note: a successful ping does not prove the account has credit left.
        """
        raise NotImplementedError

    def __repr__(self) -> str:
        return (
            f"{type(self).__name__}("
            f"model={self.model!r}, max_tokens={self.max_tokens})"
        )
